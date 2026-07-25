using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets.Exports.Engine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace PalAuto.Extractor;

internal static partial class DatasetExtractor
{
    private const string MonsterParameterPath =
        "Pal/Content/Pal/DataTable/Character/DT_PalMonsterParameter";
    private const string IconTablePath =
        "Pal/Content/Pal/DataTable/Character/DT_PalCharacterIconDataTable";
    private const string PartnerParameterPath =
        "Pal/Content/Pal/DataTable/PassiveSkill/DT_PartnerSkillParameter";
    private const string PassiveSkillPath =
        "Pal/Content/Pal/DataTable/PassiveSkill/DT_PassiveSkill_Main";
    private const string PalNamePath =
        "Pal/Content/L10N/ko/Pal/DataTable/Text/DT_PalNameText_Common";
    private const string SkillNamePath =
        "Pal/Content/L10N/ko/Pal/DataTable/Text/DT_SkillNameText_Common";
    private const string SkillDescriptionPath =
        "Pal/Content/L10N/ko/Pal/DataTable/Text/DT_SkillDescText_Common";
    private const string PartnerDescriptionPath =
        "Pal/Content/L10N/ko/Pal/DataTable/Text/" +
        "DT_PalFirstActivatedInfoText";
    private const string CommonTextPath =
        "Pal/Content/L10N/ko/Pal/DataTable/Text/DT_UI_Common_Text_Common";

    private static readonly string[] WorkSuitabilityIds =
    [
        "EmitFlame",
        "Watering",
        "Seeding",
        "GenerateElectricity",
        "Handcraft",
        "Collection",
        "Deforest",
        "Mining",
        "OilExtraction",
        "ProductMedicine",
        "Cool",
        "Transport",
        "MonsterFarm",
    ];

    private static readonly HashSet<string> WorkSuitabilityIdSet =
        new(WorkSuitabilityIds, StringComparer.Ordinal);

    private static readonly HashSet<string>
        WorkApplicabilityEvidenceKindSet =
            new(
                [
                    "explicit_work_suitability",
                    "generic_all_work_speed",
                    "target_pal_work_suitabilities",
                    "owner_pal_work_suitabilities",
                    "unknown",
                ],
                StringComparer.Ordinal);

    private static readonly string[] SourceAssetPaths =
    [
        MonsterParameterPath,
        IconTablePath,
        PartnerParameterPath,
        PassiveSkillPath,
        PalNamePath,
        SkillNamePath,
        SkillDescriptionPath,
        PartnerDescriptionPath,
        CommonTextPath,
    ];

    private static readonly JsonSerializerSettings OutputJsonSettings = new()
    {
        Formatting = Formatting.Indented,
        ContractResolver = new CamelCasePropertyNamesContractResolver(),
        NullValueHandling = NullValueHandling.Include,
    };

    [GeneratedRegex(
        @"<uiCommon\b[^>]*\bid=\|(?<id>[^|]+)\|[^>]*/>",
        RegexOptions.CultureInvariant)]
    private static partial Regex UiCommonTagRegex();

    [GeneratedRegex(
        @"<characterName\b[^>]*\bid=\|(?<id>[^|]+)\|[^>]*/>",
        RegexOptions.CultureInvariant)]
    private static partial Regex CharacterNameTagRegex();

    [GeneratedRegex(
        @"<activeSkillName\b[^>]*\bid=\|(?<id>[^|]+)\|[^>]*/>",
        RegexOptions.CultureInvariant)]
    private static partial Regex ActiveSkillNameTagRegex();

    [GeneratedRegex(
        @"<[^>]+\bid=\|(?<id>[^|]+)\|[^>]*/>",
        RegexOptions.CultureInvariant)]
    private static partial Regex GenericIdTagRegex();

    [GeneratedRegex(
        @"\{(?<id>[^{}]+)\}",
        RegexOptions.CultureInvariant)]
    private static partial Regex PlaceholderRegex();

    [GeneratedRegex(
        @"<img\b[^>]*/>",
        RegexOptions.CultureInvariant)]
    private static partial Regex ImageTagRegex();

    [GeneratedRegex(
        @"<[^>]+>",
        RegexOptions.CultureInvariant)]
    private static partial Regex RemainingMarkupRegex();

    public static int Extract(
        string pakDirectory,
        string mappingPath,
        string projectRoot)
    {
        var absoluteProjectRoot =
            Program.ResolveSafeOutputPath(pakDirectory, projectRoot);
        if (!Directory.Exists(absoluteProjectRoot))
        {
            throw new DirectoryNotFoundException(
                $"Project root does not exist: {absoluteProjectRoot}");
        }

        var (provider, mountedArchiveCount) =
            Program.OpenProvider(pakDirectory, mappingPath);

        using (provider)
        {
            var tables = SourceAssetPaths.ToDictionary(
                assetPath => assetPath,
                assetPath => LoadRows(provider, assetPath),
                StringComparer.Ordinal);
            var baseWorkSuitabilities = WorkSuitabilityIds
                .Select(
                    id => new WorkSuitabilityDefinition(
                        id,
                        RequireLocalizedText(
                            tables[CommonTextPath],
                            $"COMMON_WORK_SUITABILITY_{id}",
                            CommonTextPath),
                        null))
                .ToArray();
            var uiExtraction = GameUiExtractor.Extract(
                provider,
                absoluteProjectRoot,
                baseWorkSuitabilities);
            var workSuitabilities = uiExtraction.WorkSuitabilities;
            var worldTreeEggMap = WorldTreeEggMapExtractor.Extract(
                provider,
                absoluteProjectRoot);

            var partnerSkills = ExtractPartnerSkills(tables);
            var partnerPalIds = partnerSkills
                .SelectMany(skill => skill.PalIds)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray();
            var pals = partnerPalIds
                .Select(
                    palId => ExtractPal(
                        provider,
                        palId,
                        absoluteProjectRoot,
                        tables))
                .OrderBy(pal => pal.PaldeckNo)
                .ThenBy(pal => pal.PaldeckSuffix, StringComparer.Ordinal)
                .ThenBy(pal => pal.Id, StringComparer.Ordinal)
                .ToArray();
            var passiveSkills = ExtractPassiveSkills(tables);
            var uiAssets = uiExtraction.UiAssets with
            {
                PassiveSkillExamples = BuildPassiveUiExamples(
                    tables,
                    passiveSkills),
            };
            var skills = partnerSkills
                .Concat(passiveSkills)
                .OrderBy(skill => skill.Kind, StringComparer.Ordinal)
                .ThenBy(skill => skill.NameKo, StringComparer.Ordinal)
                .ThenBy(skill => skill.Id, StringComparer.Ordinal)
                .ToArray();

            var validationErrors = Validate(
                pals,
                skills,
                workSuitabilities,
                uiAssets);
            if (validationErrors.Count > 0)
            {
                throw new InvalidDataException(
                    "Generated dataset failed validation:\n- " +
                    string.Join("\n- ", validationErrors));
            }

            var dataDirectory =
                Path.Combine(absoluteProjectRoot, "data", "generated");
            Directory.CreateDirectory(dataDirectory);
            var metadata = ReadMetadata(
                pakDirectory,
                mappingPath,
                mountedArchiveCount,
                workSuitabilities,
                uiAssets,
                worldTreeEggMap,
                pals,
                skills,
                validationErrors);

            WriteJson(
                Path.Combine(dataDirectory, "meta.json"),
                metadata);
            WriteJson(
                Path.Combine(dataDirectory, "pals.json"),
                new PalDataset("1.1.0", pals));
            WriteJson(
                Path.Combine(dataDirectory, "skills.json"),
                new SkillDataset("1.2.0", skills));
            WriteJson(
                Path.Combine(dataDirectory, "world-tree-eggs.json"),
                worldTreeEggMap);

            Console.WriteLine(
                JsonConvert.SerializeObject(
                    new
                    {
                        ProjectRoot = absoluteProjectRoot,
                        PalCount = pals.Length,
                        PartnerSkillCount = partnerSkills.Count,
                        PassiveSkillCount = passiveSkills.Count,
                        EffectCount = skills.Sum(skill => skill.Effects.Count),
                        IconCount = pals.Count(
                            pal => File.Exists(
                                Path.Combine(
                                    absoluteProjectRoot,
                                    "public",
                                    pal.IconPath.TrimStart('/')
                                        .Replace(
                                            '/',
                                            Path.DirectorySeparatorChar)))),
                        WorkSuitabilityIconCount = workSuitabilities.Count(
                            work => work.Icon is not null),
                        PassiveUiTextureCount =
                            uiAssets.PassiveSkillTextures.Count,
                        WorldTreeEggPointCount =
                            worldTreeEggMap.Points.Count,
                        ValidationErrorCount = validationErrors.Count,
                        MountedArchiveCount = mountedArchiveCount,
                    },
                    Formatting.Indented));
        }

        return 0;
    }

    private static IReadOnlyList<SkillRecord> ExtractPartnerSkills(
        IReadOnlyDictionary<
            string,
            IReadOnlyDictionary<string, JObject>> tables)
    {
        var monsterRows = tables[MonsterParameterPath];
        var skills = new List<SkillRecord>();

        foreach (var (palId, partnerParameter) in
                 tables[PartnerParameterPath])
        {
            if (!monsterRows.TryGetValue(palId, out var monster)
                || monster.Value<bool?>("IsPal") is not true
                || monster.Value<bool?>("IsBoss") is true
                || monster.Value<int?>("ZukanIndex") is null or < 0)
            {
                continue;
            }

            var passiveRanks = RequireArray(
                partnerParameter["PassiveSkills"],
                $"{palId} partner passive ranks");
            if (passiveRanks.Count != 5)
            {
                continue;
            }

            var rankGroups = passiveRanks
                .Select(
                    (rank, rankIndex) => ExtractPartnerRankGroups(
                        palId,
                        rankIndex,
                        rank,
                        tables[PassiveSkillPath]))
                .ToArray();
            if (rankGroups[0].Count == 0)
            {
                continue;
            }

            var partnerNameTextId = ResolveTextId(
                monster,
                "OverridePartnerSkillNameTextID",
                $"PARTNERSKILL_{palId}");
            var partnerDescriptionTextId = ResolveTextId(
                monster,
                "OverridePartnerSkillDescTextID",
                $"PAL_FIRST_SPAWN_DESC_{palId}");
            var nameKo = RequireLocalizedText(
                tables[SkillNamePath],
                partnerNameTextId,
                SkillNamePath);
            var rawDescriptionKo = RequireLocalizedText(
                tables[PartnerDescriptionPath],
                partnerDescriptionTextId,
                PartnerDescriptionPath);
            var rankOneEntries = RequireArray(
                passiveRanks[0]?["SkillAndParametersArray"],
                $"{palId} partner rank 1 entries");
            var descriptionKo = RenderPartnerDescription(
                rawDescriptionKo,
                partnerParameter,
                rankOneEntries,
                tables);

            var effects = rankGroups[0]
                .Select(
                    (group, effectIndex) => BuildPartnerEffect(
                        palId,
                        effectIndex,
                        group,
                        rankGroups,
                        rawDescriptionKo,
                        tables))
                .ToArray();
            var sourcePassiveIds = rankGroups
                .SelectMany(groups => groups)
                .SelectMany(group => group.RawEffects)
                .Select(effect => effect.PassiveSkillId)
                .Distinct(StringComparer.Ordinal)
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray();

            skills.Add(
                new SkillRecord(
                    $"partner:{palId}",
                    partnerNameTextId,
                    "partner",
                    nameKo,
                    descriptionKo,
                    rawDescriptionKo,
                    [palId],
                    effects,
                    null,
                    new SkillAvailability(
                        "specific_pal_partner_skill",
                        null,
                        null),
                    null,
                    [
                        new SourceReference(
                            MonsterParameterPath,
                            palId),
                        new SourceReference(
                            PartnerParameterPath,
                            palId),
                        new SourceReference(
                            SkillNamePath,
                            partnerNameTextId),
                        new SourceReference(
                            PartnerDescriptionPath,
                            partnerDescriptionTextId),
                        .. sourcePassiveIds.Select(
                            id => new SourceReference(
                                PassiveSkillPath,
                                id)),
                    ]));
        }

        return skills;
    }

    private static IReadOnlyList<PartnerEffectGroup> ExtractPartnerRankGroups(
        string palId,
        int rankIndex,
        JToken? rank,
        IReadOnlyDictionary<string, JObject> passiveRows)
    {
        var entries = RequireArray(
            rank?["SkillAndParametersArray"],
            $"{palId} partner rank {rankIndex} entries");
        var rawEffects = new List<RawPartnerEffect>();

        for (var entryIndex = 0;
             entryIndex < entries.Count;
             entryIndex++)
        {
            var entry = entries[entryIndex] as JObject
                ?? throw new InvalidDataException(
                    $"{palId} rank {rankIndex} entry {entryIndex} is invalid.");
            var passiveSkillId = RequireString(
                entry.SelectToken("SkillName.Key"),
                $"{palId} rank {rankIndex} passive skill id");
            if (!passiveRows.TryGetValue(passiveSkillId, out var passive))
            {
                continue;
            }

            var parameters = entry["Parameters"] as JObject
                ?? throw new InvalidDataException(
                    $"{palId}/{passiveSkillId} assignment parameters " +
                    "are missing.");
            var rawWorkType =
                EnumSuffix(parameters.Value<string>("WorkType"));
            var mapObjectIds = ReadKeyArray(parameters["MapObjectId"]);
            var targetPalIds = ReadEnumArray(
                parameters.SelectToken("TriggerParam.TargetTribeIds"));
            var conditionPalIds = ReadEnumArray(parameters["PalTribeIds"])
                .Concat(
                    ReadEnumArray(
                        parameters.SelectToken(
                            "OtherOtomoConditionParam.PalTribeIds")))
                .Distinct(StringComparer.Ordinal)
                .OrderBy(id => id, StringComparer.Ordinal)
                .ToArray();

            for (var fieldIndex = 1; fieldIndex <= 4; fieldIndex++)
            {
                var effectType = EnumSuffix(
                    passive.Value<string>($"EffectType{fieldIndex}"));
                var metric = ResolveMetric(effectType);
                if (metric is null)
                {
                    continue;
                }

                var value =
                    passive.Value<decimal?>($"EffectValue{fieldIndex}");
                if (value is null or <= 0)
                {
                    continue;
                }

                var workSuitability =
                    ResolveWorkSuitability(
                        effectType,
                        rawWorkType,
                        mapObjectIds);
                var targetType = EnumSuffix(
                    passive.Value<string>($"TargetType{fieldIndex}"));
                var scope = ResolvePartnerScope(
                    palId,
                    targetType,
                    parameters.Value<bool?>("bNotAssignSelf"),
                    targetPalIds);
                var signature = string.Join(
                    '|',
                    metric,
                    workSuitability.Id ?? "all",
                    scope,
                    targetType,
                    string.Join(',', targetPalIds),
                    string.Join(',', conditionPalIds));

                rawEffects.Add(
                    new RawPartnerEffect(
                        signature,
                        passiveSkillId,
                        entryIndex,
                        fieldIndex,
                        metric,
                        workSuitability.Id,
                        workSuitability.EvidenceKind,
                        value.Value,
                        targetType,
                        scope,
                        parameters.Value<bool?>("AssignOthers"),
                        parameters.Value<bool?>("bNotAssignSelf"),
                        passive.Value<bool?>("InvokeWorker"),
                        passive.Value<bool?>("InvokeInBaseCamp"),
                        passive.Value<bool?>(
                            "IsStackablePartnerSkillBySameTribe"),
                        rawWorkType,
                        mapObjectIds,
                        targetPalIds,
                        conditionPalIds));
            }
        }

        return rawEffects
            .GroupBy(effect => effect.Signature, StringComparer.Ordinal)
            .Select(
                group =>
                {
                    var values = group
                        .Select(effect => effect.Value)
                        .Distinct()
                        .ToArray();
                    if (values.Length != 1)
                    {
                        throw new InvalidDataException(
                            $"{palId} rank {rankIndex} has conflicting " +
                            $"values for normalized effect {group.Key}.");
                    }

                    return new PartnerEffectGroup(
                        group.Key,
                        group.First().Metric,
                        group.First().WorkSuitabilityId,
                        group.First().WorkSuitabilityEvidenceKind,
                        values[0],
                        group.First().TargetType,
                        group.First().Scope,
                        group.First().AssignOthers,
                        group.First().NotAssignSelf,
                        group.First().InvokeWorker,
                        group.First().InvokeInBaseCamp,
                        group
                            .Select(effect => effect.StackableRaw)
                            .Distinct()
                            .SingleOrDefault(),
                        group
                            .SelectMany(effect => effect.TargetPalIds)
                            .Distinct(StringComparer.Ordinal)
                            .OrderBy(id => id, StringComparer.Ordinal)
                            .ToArray(),
                        group
                            .SelectMany(effect => effect.ConditionPalIds)
                            .Distinct(StringComparer.Ordinal)
                            .OrderBy(id => id, StringComparer.Ordinal)
                            .ToArray(),
                        group
                            .Select(effect => effect.RawWorkType)
                            .Distinct(StringComparer.Ordinal)
                            .OrderBy(id => id, StringComparer.Ordinal)
                            .ToArray(),
                        group
                            .SelectMany(effect => effect.MapObjectIds)
                            .Distinct(StringComparer.Ordinal)
                            .OrderBy(id => id, StringComparer.Ordinal)
                            .ToArray(),
                        group.ToArray());
                })
            .OrderBy(group => group.Signature, StringComparer.Ordinal)
            .ToArray();
    }

    private static EffectRecord BuildPartnerEffect(
        string palId,
        int effectIndex,
        PartnerEffectGroup firstRankGroup,
        IReadOnlyList<IReadOnlyList<PartnerEffectGroup>> rankGroups,
        string rawDescriptionKo,
        IReadOnlyDictionary<
            string,
            IReadOnlyDictionary<string, JObject>> tables)
    {
        var rankValues = rankGroups
            .Select(
                (groups, rankIndex) =>
                {
                    var matches = groups
                        .Where(
                            group => group.Signature.Equals(
                                firstRankGroup.Signature,
                                StringComparison.Ordinal))
                        .ToArray();
                    if (matches.Length != 1)
                    {
                        throw new InvalidDataException(
                            $"{palId} rank {rankIndex} has {matches.Length} " +
                            $"matches for {firstRankGroup.Signature}.");
                    }

                    return new RankValue(rankIndex, matches[0].Value);
                })
            .ToArray();
        var workNameKo = firstRankGroup.WorkSuitabilityId is null
            ? null
            : RequireLocalizedText(
                tables[CommonTextPath],
                "COMMON_WORK_SUITABILITY_" +
                firstRankGroup.WorkSuitabilityId,
                CommonTextPath);
        var targetNamesKo = firstRankGroup.TargetPalIds
            .Select(id => TryResolvePalName(id, tables) ?? id)
            .ToArray();
        var conditionNamesKo = firstRankGroup.ConditionPalIds
            .Select(id => TryResolvePalName(id, tables) ?? id)
            .ToArray();
        var stackable = ResolvePartnerStackability(
            firstRankGroup.StackableRaw,
            rawDescriptionKo);
        var workApplicability = ResolvePartnerWorkApplicability(
            palId,
            firstRankGroup,
            tables);

        return new EffectRecord(
            $"partner:{palId}:effect:{effectIndex + 1}",
            firstRankGroup.Metric,
            firstRankGroup.WorkSuitabilityId,
            workNameKo,
            workApplicability.Ids,
            workApplicability.EvidenceKind,
            firstRankGroup.Value,
            firstRankGroup.Metric == "work_speed"
                ? "percent"
                : "level",
            firstRankGroup.Scope,
            firstRankGroup.TargetPalIds,
            targetNamesKo,
            firstRankGroup.ConditionPalIds,
            conditionNamesKo,
            stackable,
            rankValues,
            firstRankGroup.WorkSuitabilityEvidenceKind,
            new EffectRawFields(
                firstRankGroup.TargetType,
                firstRankGroup.AssignOthers,
                firstRankGroup.NotAssignSelf,
                firstRankGroup.InvokeWorker,
                firstRankGroup.InvokeInBaseCamp,
                firstRankGroup.StackableRaw,
                firstRankGroup.RawWorkTypes,
                firstRankGroup.MapObjectIds));
    }

    private static IReadOnlyList<SkillRecord> ExtractPassiveSkills(
        IReadOnlyDictionary<
            string,
            IReadOnlyDictionary<string, JObject>> tables)
    {
        var skills = new List<SkillRecord>();

        foreach (var (passiveId, passive) in tables[PassiveSkillPath])
        {
            if (EnumSuffix(passive.Value<string>("Category"))
                != "SortDisplayable")
            {
                continue;
            }

            var effects = new List<EffectRecord>();
            for (var fieldIndex = 1; fieldIndex <= 4; fieldIndex++)
            {
                var effectType = EnumSuffix(
                    passive.Value<string>($"EffectType{fieldIndex}"));
                var metric = ResolveMetric(effectType);
                var value =
                    passive.Value<decimal?>($"EffectValue{fieldIndex}");
                var targetType = EnumSuffix(
                    passive.Value<string>($"TargetType{fieldIndex}"));
                if (metric is null
                    || value is null or <= 0
                    || targetType is not ("ToSelf" or "ToBaseCampPal"))
                {
                    continue;
                }

                var workSuitability =
                    ResolveWorkSuitability(effectType, "None", []);
                var workNameKo = workSuitability.Id is null
                    ? null
                    : RequireLocalizedText(
                        tables[CommonTextPath],
                        "COMMON_WORK_SUITABILITY_" + workSuitability.Id,
                        CommonTextPath);
                var workApplicability =
                    ResolvePassiveWorkApplicability(
                        metric,
                        workSuitability);
                effects.Add(
                    new EffectRecord(
                        $"passive:{passiveId}:effect:{effects.Count + 1}",
                        metric,
                        workSuitability.Id,
                        workNameKo,
                        workApplicability.Ids,
                        workApplicability.EvidenceKind,
                        value.Value,
                        metric == "work_speed" ? "percent" : "level",
                        targetType == "ToSelf"
                            ? "self"
                            : "all_base_pals",
                        [],
                        [],
                        [],
                        [],
                        null,
                        null,
                        "structured",
                        new EffectRawFields(
                            targetType,
                            null,
                            null,
                            passive.Value<bool?>("InvokeWorker"),
                            passive.Value<bool?>("InvokeInBaseCamp"),
                            null,
                            [],
                            [])));
            }

            if (effects.Count == 0)
            {
                continue;
            }

            var nameTextId = ResolveTextId(
                passive,
                "OverrideNameTextID",
                $"PASSIVE_{passiveId}");
            var nameKo = RequireLocalizedText(
                tables[SkillNamePath],
                nameTextId,
                SkillNamePath);
            var descriptionTextId = ResolveTextId(
                passive,
                "OverrideDescMsgID",
                $"PASSIVE_{passiveId}");
            var rawDescriptionKo = TryReadLocalizedText(
                tables[SkillDescriptionPath],
                descriptionTextId);
            var descriptionKo = rawDescriptionKo is null
                ? BuildStructuredPassiveDescription(effects)
                : RenderPassiveDescription(
                    rawDescriptionKo,
                    passive,
                    tables[CommonTextPath]);
            var availability = ResolvePassiveAvailability(passive);
            var passiveUi = ResolvePassiveUiClassification(passive);

            skills.Add(
                new SkillRecord(
                    $"passive:{passiveId}",
                    passiveId,
                    "passive",
                    nameKo,
                    descriptionKo,
                    rawDescriptionKo,
                    [],
                    effects,
                    passive.Value<int?>("Rank"),
                    availability,
                    passiveUi,
                    [
                        new SourceReference(
                            PassiveSkillPath,
                            passiveId),
                        new SourceReference(
                            SkillNamePath,
                            nameTextId),
                        .. rawDescriptionKo is null
                            ? []
                            : new[]
                            {
                                new SourceReference(
                                    SkillDescriptionPath,
                                    descriptionTextId),
                            },
                    ]));
        }

        return skills;
    }

    private static WorkApplicabilityResolution
        ResolvePartnerWorkApplicability(
            string ownerPalId,
            PartnerEffectGroup effect,
            IReadOnlyDictionary<
                string,
                IReadOnlyDictionary<string, JObject>> tables)
    {
        if (effect.WorkSuitabilityId is not null)
        {
            return new WorkApplicabilityResolution(
                [effect.WorkSuitabilityId],
                "explicit_work_suitability");
        }

        if (effect.Metric != "work_speed")
        {
            return new WorkApplicabilityResolution([], "unknown");
        }

        if (effect.TargetPalIds.Count > 0)
        {
            var targetWorkSuitabilityIds = effect.TargetPalIds
                .SelectMany(
                    targetPalId => ReadPalWorkSuitabilityIds(
                        targetPalId,
                        tables[MonsterParameterPath]))
                .ToHashSet(StringComparer.Ordinal);
            return new WorkApplicabilityResolution(
                WorkSuitabilityIds
                    .Where(targetWorkSuitabilityIds.Contains)
                    .ToArray(),
                "target_pal_work_suitabilities");
        }

        if (effect.Scope == "self")
        {
            return new WorkApplicabilityResolution(
                ReadPalWorkSuitabilityIds(
                    ownerPalId,
                    tables[MonsterParameterPath]),
                "owner_pal_work_suitabilities");
        }

        return new WorkApplicabilityResolution(
            WorkSuitabilityIds.ToArray(),
            "generic_all_work_speed");
    }

    private static WorkApplicabilityResolution
        ResolvePassiveWorkApplicability(
            string metric,
            WorkSuitabilityResolution workSuitability)
    {
        if (workSuitability.Id is not null)
        {
            return new WorkApplicabilityResolution(
                [workSuitability.Id],
                "explicit_work_suitability");
        }

        return metric == "work_speed"
            ? new WorkApplicabilityResolution(
                WorkSuitabilityIds.ToArray(),
                "generic_all_work_speed")
            : new WorkApplicabilityResolution([], "unknown");
    }

    private static IReadOnlyList<string> ReadPalWorkSuitabilityIds(
        string palId,
        IReadOnlyDictionary<string, JObject> monsterRows)
    {
        var monster = RequireRow(
            monsterRows,
            palId,
            MonsterParameterPath);
        return WorkSuitabilityIds
            .Where(
                id => (monster.Value<int?>(
                    $"WorkSuitability_{id}") ?? 0) > 0)
            .ToArray();
    }

    private static PalRecord ExtractPal(
        DefaultFileProvider provider,
        string palId,
        string projectRoot,
        IReadOnlyDictionary<
            string,
            IReadOnlyDictionary<string, JObject>> tables)
    {
        var monster = RequireRow(
            tables[MonsterParameterPath],
            palId,
            MonsterParameterPath);
        var icon = RequireRow(
            tables[IconTablePath],
            palId,
            IconTablePath);
        var nameTextId = ResolveTextId(
            monster,
            "OverrideNameTextID",
            $"PAL_NAME_{palId}");
        var nameKo = RequireLocalizedText(
            tables[PalNamePath],
            nameTextId,
            PalNamePath);
        var workSuitabilities = WorkSuitabilityIds
            .Select(
                id => new PalWorkSuitability(
                    id,
                    RequireLocalizedText(
                        tables[CommonTextPath],
                        $"COMMON_WORK_SUITABILITY_{id}",
                        CommonTextPath),
                    monster.Value<int?>($"WorkSuitability_{id}") ?? 0))
            .Where(suitability => suitability.Level > 0)
            .ToArray();

        var iconObjectPath = RequireString(
            icon.SelectToken("Icon.AssetPathName"),
            $"{palId} icon object path");
        var iconAssetPath = ConvertObjectPathToPackagePath(iconObjectPath);
        var iconRelativePath = $"/generated/pals/{palId}.webp";
        var iconOutputPath = Path.Combine(
            projectRoot,
            "public",
            iconRelativePath.TrimStart('/')
                .Replace('/', Path.DirectorySeparatorChar));
        var iconResult = TextureExporter.WriteWebp(
            provider,
            iconAssetPath,
            iconOutputPath);
        var iconSha256 = Convert.ToHexString(
            SHA256.HashData(File.ReadAllBytes(iconOutputPath)))
            .ToLowerInvariant();

        return new PalRecord(
            palId,
            monster.Value<int?>("ZukanIndex"),
            monster.Value<string>("ZukanIndexSuffix") ?? string.Empty,
            nameKo,
            null,
            workSuitabilities,
            iconRelativePath,
            iconResult.Width,
            iconResult.Height,
            iconSha256,
            $"partner:{palId}",
            [
                new SourceReference(MonsterParameterPath, palId),
                new SourceReference(PalNamePath, nameTextId),
                new SourceReference(IconTablePath, palId),
                new SourceReference(iconAssetPath, palId),
            ]);
    }

    private static WorkSuitabilityResolution ResolveWorkSuitability(
        string effectType,
        string rawWorkType,
        IReadOnlyList<string> mapObjectIds)
    {
        const string rankPrefix = "WorkSuitabilityAddRank_";
        if (effectType.StartsWith(rankPrefix, StringComparison.Ordinal))
        {
            return new WorkSuitabilityResolution(
                effectType[rankPrefix.Length..],
                "structured");
        }

        if (effectType != "CraftSpeed")
        {
            return new WorkSuitabilityResolution(null, "structured");
        }

        var normalizedWorkType = rawWorkType.EndsWith(
            "_Farm",
            StringComparison.Ordinal)
            ? rawWorkType[..^"_Farm".Length]
            : rawWorkType;
        if (WorkSuitabilityIdSet.Contains(normalizedWorkType))
        {
            return new WorkSuitabilityResolution(
                normalizedWorkType,
                "structured");
        }

        if (mapObjectIds.Any(
                id => id.Contains("WorkBench", StringComparison.Ordinal)
                      || id.Contains("Factory", StringComparison.Ordinal)))
        {
            return new WorkSuitabilityResolution(
                "Handcraft",
                "structured_with_map_object_context");
        }

        return new WorkSuitabilityResolution(null, "structured");
    }

    private static string? ResolveMetric(string effectType)
    {
        if (effectType == "CraftSpeed")
        {
            return "work_speed";
        }

        return effectType.StartsWith(
            "WorkSuitabilityAddRank_",
            StringComparison.Ordinal)
            ? "work_suitability_rank"
            : null;
    }

    private static string ResolvePartnerScope(
        string palId,
        string targetType,
        bool? notAssignSelf,
        IReadOnlyList<string> targetPalIds)
    {
        if (targetType == "ToSelf")
        {
            return "self";
        }

        if (targetType == "ToBaseCampPal")
        {
            if (notAssignSelf is true
                || targetPalIds.Any(
                    id => !id.Equals(
                        palId,
                        StringComparison.Ordinal)))
            {
                return "other_base_pals";
            }

            return "all_base_pals";
        }

        return "unknown";
    }

    private static bool? ResolvePartnerStackability(
        bool? structuredValue,
        string rawDescriptionKo)
    {
        if (structuredValue is false)
        {
            return false;
        }

        if (structuredValue is true
            && rawDescriptionKo.Contains(
                "중복 불가",
                StringComparison.Ordinal))
        {
            return null;
        }

        return structuredValue;
    }

    private static SkillAvailability ResolvePassiveAvailability(
        JObject passive)
    {
        if (passive.Value<bool?>("AddPal") is true)
        {
            return new SkillAvailability(
                "standard_pal_trait_pool",
                passive.Value<int?>("LotteryWeight"),
                "structured");
        }

        if (passive.Value<bool?>("AddRarePal") is true)
        {
            return new SkillAvailability(
                "rare_pal_trait",
                passive.Value<int?>("LotteryWeight"),
                "structured");
        }

        if (passive.Value<bool?>("AddWorldTreePal") is true)
        {
            return new SkillAvailability(
                "world_tree_pal_trait_pool",
                passive.Value<int?>("LotteryWeight"),
                "structured");
        }

        if (passive.Value<bool?>("AddMutationPal") is true)
        {
            return new SkillAvailability(
                "mutation_pal_trait_pool",
                passive.Value<int?>("LotteryWeight"),
                "structured");
        }

        return new SkillAvailability(
            "unknown",
            passive.Value<int?>("LotteryWeight"),
            "structured");
    }

    private static PassiveUiClassification
        ResolvePassiveUiClassification(JObject passive)
    {
        var rank = passive.Value<int?>("Rank");
        return rank switch
        {
            null => new PassiveUiClassification(
                "unknown",
                null,
                "widget_rank_missing"),
            < 0 => new PassiveUiClassification(
                "common",
                "common_negative",
                "widget_rank_dispatch"),
            0 or 1 => new PassiveUiClassification(
                "common",
                "common",
                "widget_rank_dispatch"),
            2 or 3 => new PassiveUiClassification(
                "rare_yellow",
                "rare_yellow",
                "widget_rank_dispatch"),
            4 => new PassiveUiClassification(
                "rare2_blue",
                "rare2_blue",
                "widget_rank_dispatch"),
            5 => new PassiveUiClassification(
                "world_tree",
                "world_tree",
                "widget_rank_dispatch"),
            _ => new PassiveUiClassification(
                "unknown",
                null,
                "widget_rank_out_of_range"),
        };
    }

    private static IReadOnlyList<PassiveUiExample>
        BuildPassiveUiExamples(
            IReadOnlyDictionary<
                string,
                IReadOnlyDictionary<string, JObject>> tables,
            IReadOnlyList<SkillRecord> passiveSkills)
    {
        var examples = new[]
        {
            (StyleId: "common", GameId: "CraftSpeed_up1"),
            (StyleId: "rare_yellow", GameId: "CraftSpeed_up2"),
            (StyleId: "rare2_blue", GameId: "CraftSpeed_up3"),
            (StyleId: "world_tree", GameId: "WorldTree_CraftSpeed"),
        };

        return examples
            .Select(
                example => BuildPassiveUiExample(
                    example.StyleId,
                    example.GameId,
                    tables,
                    passiveSkills))
            .ToArray();
    }

    private static PassiveUiExample BuildPassiveUiExample(
        string styleId,
        string passiveId,
        IReadOnlyDictionary<
            string,
            IReadOnlyDictionary<string, JObject>> tables,
        IReadOnlyList<SkillRecord> passiveSkills)
    {
        var extractedSkill = passiveSkills.SingleOrDefault(
            skill => skill.GameId == passiveId);
        if (extractedSkill is not null)
        {
            return new PassiveUiExample(
                styleId,
                passiveId,
                extractedSkill.NameKo,
                extractedSkill.DescriptionKo,
                extractedSkill.Rank,
                extractedSkill.Sources);
        }

        var passive = RequireRow(
            tables[PassiveSkillPath],
            passiveId,
            PassiveSkillPath);
        var nameTextId = ResolveTextId(
            passive,
            "OverrideNameTextID",
            $"PASSIVE_{passiveId}");
        var descriptionTextId = ResolveTextId(
            passive,
            "OverrideDescMsgID",
            $"PASSIVE_{passiveId}");
        var nameKo = RequireLocalizedText(
            tables[SkillNamePath],
            nameTextId,
            SkillNamePath);
        var rawDescriptionKo = RequireLocalizedText(
            tables[SkillDescriptionPath],
            descriptionTextId,
            SkillDescriptionPath);

        return new PassiveUiExample(
            styleId,
            passiveId,
            nameKo,
            RenderPassiveDescription(
                rawDescriptionKo,
                passive,
                tables[CommonTextPath]),
            passive.Value<int?>("Rank"),
            [
                new SourceReference(PassiveSkillPath, passiveId),
                new SourceReference(SkillNamePath, nameTextId),
                new SourceReference(
                    SkillDescriptionPath,
                    descriptionTextId),
            ]);
    }

    private static string BuildStructuredPassiveDescription(
        IReadOnlyList<EffectRecord> effects)
    {
        return string.Join(
            '\n',
            effects.Select(
                effect => effect.Metric == "work_speed"
                    ? $"작업 속도 +{FormatNumber(effect.Value)}%"
                    : $"{effect.WorkSuitabilityNameKo ?? "작업"} " +
                      $"작업 적성 레벨 +{FormatNumber(effect.Value)}"));
    }

    private static string RenderPartnerDescription(
        string rawDescription,
        JObject partnerParameter,
        JArray rankOneEntries,
        IReadOnlyDictionary<
            string,
            IReadOnlyDictionary<string, JObject>> tables)
    {
        var placeholders = new Dictionary<string, string>(
            StringComparer.Ordinal);
        if (partnerParameter.SelectToken(
                "ActiveSkill.ActiveSkill_MainValueByRank") is JArray
            { Count: > 0 } activeSkillMainValues
            && activeSkillMainValues[0]?.Value<decimal?>() is
            { } activeSkillMainValue)
        {
            placeholders["ActiveSkillMainValueByRank"] =
                FormatNumber(activeSkillMainValue);
        }

        for (var passiveIndex = 0;
             passiveIndex < rankOneEntries.Count;
             passiveIndex++)
        {
            var passiveSkillId = RequireString(
                rankOneEntries[passiveIndex]?.SelectToken("SkillName.Key"),
                $"rank 1 passive skill id at index {passiveIndex}");
            if (!tables[PassiveSkillPath].TryGetValue(
                    passiveSkillId,
                    out var passive))
            {
                continue;
            }

            for (var effectIndex = 1; effectIndex <= 4; effectIndex++)
            {
                var value =
                    passive.Value<decimal?>($"EffectValue{effectIndex}");
                if (value is null)
                {
                    continue;
                }

                placeholders[
                    $"Passive{passiveIndex + 1}_EffectValue{effectIndex}"] =
                    FormatNumber(value.Value);
            }
        }

        return RenderLocalizedMarkup(
            rawDescription,
            placeholders,
            tables);
    }

    private static string RenderPassiveDescription(
        string rawDescription,
        JObject passive,
        IReadOnlyDictionary<string, JObject> commonTextRows)
    {
        var placeholders = new Dictionary<string, string>(
            StringComparer.Ordinal);
        for (var effectIndex = 1; effectIndex <= 4; effectIndex++)
        {
            var value =
                passive.Value<decimal?>($"EffectValue{effectIndex}");
            if (value is not null)
            {
                placeholders[$"EffectValue{effectIndex}"] =
                    FormatNumber(value.Value);
            }
        }

        var rendered = PlaceholderRegex().Replace(
            rawDescription,
            match => placeholders.TryGetValue(
                match.Groups["id"].Value,
                out var value)
                ? value
                : match.Value);
        rendered = UiCommonTagRegex().Replace(
            rendered,
            match => TryReadLocalizedText(
                    commonTextRows,
                    match.Groups["id"].Value)
                ?? match.Groups["id"].Value);
        rendered = ImageTagRegex().Replace(rendered, string.Empty);
        rendered = GenericIdTagRegex().Replace(
            rendered,
            match => match.Groups["id"].Value);
        rendered = RemainingMarkupRegex().Replace(rendered, string.Empty);
        return NormalizeRenderedText(rendered);
    }

    private static string RenderLocalizedMarkup(
        string rawDescription,
        IReadOnlyDictionary<string, string> placeholders,
        IReadOnlyDictionary<
            string,
            IReadOnlyDictionary<string, JObject>> tables)
    {
        var rendered = PlaceholderRegex().Replace(
            rawDescription,
            match => placeholders.TryGetValue(
                match.Groups["id"].Value,
                out var value)
                ? value
                : match.Value);
        rendered = UiCommonTagRegex().Replace(
            rendered,
            match => TryReadLocalizedText(
                    tables[CommonTextPath],
                    match.Groups["id"].Value)
                ?? match.Groups["id"].Value);
        rendered = CharacterNameTagRegex().Replace(
            rendered,
            match => TryResolvePalName(
                    match.Groups["id"].Value,
                    tables)
                ?? match.Groups["id"].Value);
        rendered = ActiveSkillNameTagRegex().Replace(
            rendered,
            match => TryReadLocalizedText(
                    tables[SkillNamePath],
                    $"ACTION_SKILL_{match.Groups["id"].Value}")
                ?? match.Groups["id"].Value);
        rendered = ImageTagRegex().Replace(rendered, string.Empty);
        rendered = GenericIdTagRegex().Replace(
            rendered,
            match => match.Groups["id"].Value);
        rendered = RemainingMarkupRegex().Replace(rendered, string.Empty);
        return NormalizeRenderedText(rendered);
    }

    private static string NormalizeRenderedText(string rendered)
    {
        return string.Join(
            '\n',
            rendered
                .Replace("\r\n", "\n", StringComparison.Ordinal)
                .Split('\n')
                .Select(line => line.Trim())
                .Where(line => line.Length > 0));
    }

    private static string? TryResolvePalName(
        string palId,
        IReadOnlyDictionary<
            string,
            IReadOnlyDictionary<string, JObject>> tables)
    {
        var monsterRows = tables[MonsterParameterPath];
        var nameTextId = monsterRows.TryGetValue(palId, out var monster)
            ? ResolveTextId(
                monster,
                "OverrideNameTextID",
                $"PAL_NAME_{palId}")
            : $"PAL_NAME_{palId}";
        return TryReadLocalizedText(tables[PalNamePath], nameTextId);
    }

    private static IReadOnlyList<string> Validate(
        IReadOnlyList<PalRecord> pals,
        IReadOnlyList<SkillRecord> skills,
        IReadOnlyList<WorkSuitabilityDefinition> workSuitabilities,
        GameUiAssets uiAssets)
    {
        var errors = new List<string>();
        var palIds = pals
            .Select(pal => pal.Id)
            .ToHashSet(StringComparer.Ordinal);
        var skillIds = skills
            .Select(skill => skill.Id)
            .ToHashSet(StringComparer.Ordinal);

        if (palIds.Count != pals.Count)
        {
            errors.Add("Duplicate pal IDs exist.");
        }

        if (skillIds.Count != skills.Count)
        {
            errors.Add("Duplicate skill IDs exist.");
        }

        var passiveUiStyleIds = uiAssets.PassiveSkillStyles
            .Select(style => style.Id)
            .ToHashSet(StringComparer.Ordinal);
        var expectedWorkIconIds = WorkSuitabilityIds
            .ToHashSet(StringComparer.Ordinal);
        var actualWorkIconIds = workSuitabilities
            .Where(work => work.Icon is not null)
            .Select(work => work.Id)
            .ToHashSet(StringComparer.Ordinal);
        if (!actualWorkIconIds.SetEquals(expectedWorkIconIds))
        {
            errors.Add("Work suitability icon set is incomplete.");
        }

        if (workSuitabilities.Any(
                work => work.Icon is not null
                        && (work.Icon.Width <= 0
                            || work.Icon.Height <= 0
                            || work.Icon.Sha256.Length != 64)))
        {
            errors.Add("Work suitability icon metadata is invalid.");
        }

        var expectedPassiveTextureKeys = new[]
            {
                "frame",
                "frameOverlay",
                "prismBand",
                "prismTriangle",
                "backgroundGradient",
                "rankArrow0",
                "rankArrow1",
                "rankArrow2",
                "rankArrow3",
                "rankArrow4",
                "rankArrow5",
                "worldTreeDissolve",
                "worldTreeDissolveTarget",
                "worldTreeScroll",
                "worldTreeScrollMask",
            }
            .ToHashSet(StringComparer.Ordinal);
        if (!uiAssets.PassiveSkillTextures.Keys
                .ToHashSet(StringComparer.Ordinal)
                .SetEquals(expectedPassiveTextureKeys)
            || uiAssets.PassiveSkillTextures.Values.Any(
                texture => texture.Width <= 0
                           || texture.Height <= 0
                           || texture.Sha256.Length != 64))
        {
            errors.Add("Passive skill UI texture metadata is invalid.");
        }

        var expectedWorldTreeLayerIds = new[]
            {
                "dissolve",
                "scroll_slow",
                "scroll_fast",
                "base_gradient",
            }
            .ToHashSet(StringComparer.Ordinal);
        var actualWorldTreeLayerIds = uiAssets.WorldTreeEffect.Layers
            .Select(layer => layer.Id)
            .ToHashSet(StringComparer.Ordinal);
        if (uiAssets.WorldTreeEffect.Opacity <= 0
            || !actualWorldTreeLayerIds.SetEquals(
                expectedWorldTreeLayerIds)
            || uiAssets.WorldTreeEffect.Layers.Any(
                layer => string.IsNullOrWhiteSpace(
                             layer.MaterialAssetPath)
                         || layer.BrushTintAlpha is < 0 or > 1
                         || layer.TextureKeys.Any(
                             key => !uiAssets.PassiveSkillTextures
                                 .ContainsKey(key))))
        {
            errors.Add("World Tree passive UI layer metadata is invalid.");
        }

        if (uiAssets.PassiveSkillExamples.Count != 4
            || uiAssets.PassiveSkillExamples.Any(
                example => !passiveUiStyleIds.Contains(example.StyleId)))
        {
            errors.Add("Passive skill UI examples are incomplete.");
        }

        foreach (var pal in pals)
        {
            if (string.IsNullOrWhiteSpace(pal.NameKo))
            {
                errors.Add($"{pal.Id} has no Korean name.");
            }

            if (!skillIds.Contains(pal.PartnerSkillId))
            {
                errors.Add(
                    $"{pal.Id} references missing skill " +
                    $"{pal.PartnerSkillId}.");
            }

            if (pal.IconWidth <= 0
                || pal.IconHeight <= 0
                || pal.IconSha256.Length != 64)
            {
                errors.Add($"{pal.Id} has invalid icon metadata.");
            }

            if (pal.WorkSuitabilities.Any(
                    work => work.Level <= 0
                            || !WorkSuitabilityIdSet.Contains(work.Id)))
            {
                errors.Add($"{pal.Id} has invalid work suitability.");
            }
        }

        foreach (var skill in skills)
        {
            if (string.IsNullOrWhiteSpace(skill.NameKo)
                || string.IsNullOrWhiteSpace(skill.DescriptionKo))
            {
                errors.Add($"{skill.Id} has missing Korean text.");
            }

            if (skill.PalIds.Any(id => !palIds.Contains(id)))
            {
                errors.Add($"{skill.Id} references a missing pal.");
            }

            if (skill.Effects.Count == 0)
            {
                errors.Add($"{skill.Id} has no normalized effects.");
            }

            if (skill.Kind == "passive"
                && (skill.PassiveUi?.StyleId is null
                    || !passiveUiStyleIds.Contains(
                        skill.PassiveUi.StyleId)))
            {
                errors.Add($"{skill.Id} has invalid passive UI metadata.");
            }

            if (skill.Kind == "partner" && skill.PassiveUi is not null)
            {
                errors.Add($"{skill.Id} has unexpected passive UI metadata.");
            }

            if (skill.Effects.Select(effect => effect.Id).Distinct(
                    StringComparer.Ordinal).Count() != skill.Effects.Count)
            {
                errors.Add($"{skill.Id} has duplicate effect IDs.");
            }

            foreach (var effect in skill.Effects)
            {
                if (effect.Value <= 0)
                {
                    errors.Add($"{effect.Id} is not a positive effect.");
                }

                if (effect.WorkSuitabilityId is not null
                    && !WorkSuitabilityIdSet.Contains(
                        effect.WorkSuitabilityId))
                {
                    errors.Add(
                        $"{effect.Id} has unknown work suitability " +
                        $"{effect.WorkSuitabilityId}.");
                }

                if (effect.ApplicableWorkSuitabilityIds.Count == 0)
                {
                    errors.Add(
                        $"{effect.Id} has no applicable work suitability.");
                }

                if (effect.ApplicableWorkSuitabilityIds
                    .Any(id => !WorkSuitabilityIdSet.Contains(id)))
                {
                    errors.Add(
                        $"{effect.Id} has an unknown applicable work " +
                        "suitability.");
                }

                if (effect.ApplicableWorkSuitabilityIds
                        .Distinct(StringComparer.Ordinal)
                        .Count()
                    != effect.ApplicableWorkSuitabilityIds.Count)
                {
                    errors.Add(
                        $"{effect.Id} has duplicate applicable work " +
                        "suitabilities.");
                }

                if (effect.WorkSuitabilityId is not null
                    && !effect.ApplicableWorkSuitabilityIds.Contains(
                        effect.WorkSuitabilityId,
                        StringComparer.Ordinal))
                {
                    errors.Add(
                        $"{effect.Id} does not include its explicit work " +
                        "suitability in applicability.");
                }

                if (!WorkApplicabilityEvidenceKindSet.Contains(
                    effect.WorkApplicabilityEvidenceKind))
                {
                    errors.Add(
                        $"{effect.Id} has unknown work applicability " +
                        $"evidence {effect.WorkApplicabilityEvidenceKind}.");
                }

                if (skill.Kind == "partner"
                    && (effect.RankValues?.Count != 5
                        || effect.RankValues.Any(
                            rank => rank.Value <= 0)))
                {
                    errors.Add($"{effect.Id} has invalid rank values.");
                }
            }
        }

        return errors;
    }

    private static DatasetMetadata ReadMetadata(
        string pakDirectory,
        string mappingPath,
        int mountedArchiveCount,
        IReadOnlyList<WorkSuitabilityDefinition> workSuitabilities,
        GameUiAssets uiAssets,
        WorldTreeEggMapDataset worldTreeEggMap,
        IReadOnlyList<PalRecord> pals,
        IReadOnlyList<SkillRecord> skills,
        IReadOnlyList<string> validationErrors)
    {
        var pakPath = Path.Combine(pakDirectory, "Pal-Windows.pak");
        var pakInfo = new FileInfo(pakPath);
        if (!pakInfo.Exists)
        {
            throw new FileNotFoundException(
                "Pal-Windows.pak does not exist.",
                pakPath);
        }

        var steamAppsPath =
            Program.FindAncestorDirectory(pakDirectory, "steamapps");
        var manifestPath = steamAppsPath is null
            ? null
            : Path.Combine(steamAppsPath, "appmanifest_1623730.acf");
        var manifest = manifestPath is not null && File.Exists(manifestPath)
            ? File.ReadAllText(manifestPath)
            : string.Empty;

        return new DatasetMetadata(
            "1.5.0",
            "1623730",
            ReadManifestValue(manifest, "buildid") ?? "unknown",
            ReadManifestValue(manifest, "language") ?? "unknown",
            "ko",
            "1.0",
            "5.1.1",
            DateTimeOffset.UtcNow,
            "Pal/Content/Paks/Pal-Windows.pak",
            pakInfo.Length,
            pakInfo.LastWriteTimeUtc,
            Path.GetFileName(mappingPath),
            Convert.ToHexString(
                SHA256.HashData(File.ReadAllBytes(mappingPath)))
                .ToLowerInvariant(),
            mountedArchiveCount,
            SourceAssetPaths
                .Concat(uiAssets.SourceAssets)
                .Concat(worldTreeEggMap.SourceAssets)
                .Distinct(StringComparer.Ordinal)
                .ToArray(),
            workSuitabilities,
            uiAssets,
            new DatasetCounts(
                pals.Count,
                skills.Count(skill => skill.Kind == "partner"),
                skills.Count(skill => skill.Kind == "passive"),
                skills.Sum(skill => skill.Effects.Count),
                pals.Count,
                workSuitabilities.Count(work => work.Icon is not null),
                uiAssets.PassiveSkillTextures.Count,
                worldTreeEggMap.Points.Count),
            new DatasetValidation(
                validationErrors.Count == 0 ? "passed" : "failed",
                validationErrors));
    }

    private static string? ReadManifestValue(
        string manifest,
        string key)
    {
        var match = Regex.Match(
            manifest,
            $"\"{Regex.Escape(key)}\"\\s+\"(?<value>[^\"]+)\"",
            RegexOptions.CultureInvariant | RegexOptions.IgnoreCase);
        return match.Success ? match.Groups["value"].Value : null;
    }

    private static void WriteJson(string outputPath, object value)
    {
        var directory = Path.GetDirectoryName(outputPath)
            ?? throw new InvalidOperationException(
                $"Output path has no parent directory: {outputPath}");
        Directory.CreateDirectory(directory);
        File.WriteAllText(
            outputPath,
            JsonConvert.SerializeObject(value, OutputJsonSettings),
            new UTF8Encoding(false));
    }

    private static IReadOnlyDictionary<string, JObject> LoadRows(
        DefaultFileProvider provider,
        string assetPath)
    {
        var package = provider.LoadPackage(assetPath);
        var table = package.GetExports().OfType<UDataTable>().Single();

        return table.RowMap.ToDictionary(
            row => row.Key.Text,
            row => JObject.Parse(
                JsonConvert.SerializeObject(row.Value)),
            StringComparer.Ordinal);
    }

    private static JObject RequireRow(
        IReadOnlyDictionary<string, JObject> rows,
        string rowId,
        string assetPath)
    {
        return rows.TryGetValue(rowId, out var row)
            ? row
            : throw new InvalidDataException(
                $"Required row {rowId} is missing from {assetPath}.");
    }

    private static string RequireLocalizedText(
        IReadOnlyDictionary<string, JObject> rows,
        string rowId,
        string assetPath)
    {
        return TryReadLocalizedText(rows, rowId)
            ?? throw new InvalidDataException(
                $"Localized text {rowId} is missing from {assetPath}.");
    }

    private static string? TryReadLocalizedText(
        IReadOnlyDictionary<string, JObject> rows,
        string rowId)
    {
        if (!rows.TryGetValue(rowId, out var row))
        {
            return null;
        }

        var localized =
            row.SelectToken("TextData.LocalizedString")?.Value<string>();
        if (!string.IsNullOrWhiteSpace(localized))
        {
            return localized;
        }

        var source =
            row.SelectToken("TextData.SourceString")?.Value<string>();
        return string.IsNullOrWhiteSpace(source) ? null : source;
    }

    private static JArray RequireArray(
        JToken? token,
        string description)
    {
        return token as JArray
            ?? throw new InvalidDataException(
                $"Required array is missing: {description}.");
    }

    private static string RequireString(
        JToken? token,
        string description)
    {
        var value = token?.Value<string>();
        return !string.IsNullOrWhiteSpace(value)
            ? value
            : throw new InvalidDataException(
                $"Required string is missing: {description}.");
    }

    private static string ResolveTextId(
        JObject row,
        string overrideField,
        string fallbackTextId)
    {
        var overrideTextId = row.Value<string>(overrideField);
        return string.IsNullOrWhiteSpace(overrideTextId)
               || overrideTextId.Equals(
                   "None",
                   StringComparison.OrdinalIgnoreCase)
            ? fallbackTextId
            : overrideTextId;
    }

    private static string ConvertObjectPathToPackagePath(string objectPath)
    {
        var packagePath = objectPath;
        var objectSeparatorIndex = packagePath.LastIndexOf('.');
        if (objectSeparatorIndex >= 0)
        {
            packagePath = packagePath[..objectSeparatorIndex];
        }

        const string gamePrefix = "/Game/";
        if (!packagePath.StartsWith(gamePrefix, StringComparison.Ordinal))
        {
            throw new InvalidDataException(
                $"Unsupported icon object path: {objectPath}");
        }

        return "Pal/Content/" + packagePath[gamePrefix.Length..];
    }

    private static IReadOnlyList<string> ReadKeyArray(JToken? token)
    {
        return token is not JArray array
            ? []
            : array
                .Select(item => item?["Key"]?.Value<string>())
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value!)
                .ToArray();
    }

    private static IReadOnlyList<string> ReadEnumArray(JToken? token)
    {
        return token is not JArray array
            ? []
            : array
                .Select(item => EnumSuffix(item?.Value<string>()))
                .Where(value => value != "unknown" && value != "None")
                .ToArray();
    }

    private static string EnumSuffix(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "unknown";
        }

        var separatorIndex = value.LastIndexOf("::", StringComparison.Ordinal);
        return separatorIndex >= 0
            ? value[(separatorIndex + 2)..]
            : value;
    }

    private static string FormatNumber(decimal value)
    {
        return value.ToString("0.####", CultureInfo.InvariantCulture);
    }
}

internal sealed record PalDataset(
    string SchemaVersion,
    IReadOnlyList<PalRecord> Pals);

internal sealed record SkillDataset(
    string SchemaVersion,
    IReadOnlyList<SkillRecord> Skills);

internal sealed record DatasetMetadata(
    string SchemaVersion,
    string SteamAppId,
    string SteamBuildId,
    string SteamLanguage,
    string Localization,
    string GameRelease,
    string EngineVersion,
    DateTimeOffset ExtractedAtUtc,
    string PakRelativePath,
    long PakSize,
    DateTime PakModifiedAtUtc,
    string MappingFileName,
    string MappingSha256,
    int MountedArchiveCount,
    IReadOnlyList<string> SourceAssets,
    IReadOnlyList<WorkSuitabilityDefinition> WorkSuitabilities,
    GameUiAssets UiAssets,
    DatasetCounts Counts,
    DatasetValidation Validation);

internal sealed record DatasetCounts(
    int PalCount,
    int PartnerSkillCount,
    int PassiveSkillCount,
    int EffectCount,
    int IconCount,
    int WorkSuitabilityIconCount,
    int PassiveUiTextureCount,
    int WorldTreeEggPointCount);

internal sealed record DatasetValidation(
    string Status,
    IReadOnlyList<string> Errors);

internal sealed record WorkSuitabilityDefinition(
    string Id,
    string NameKo,
    GeneratedImageAsset? Icon);

internal sealed record PalRecord(
    string Id,
    int? PaldeckNo,
    string PaldeckSuffix,
    string NameKo,
    string? NameEn,
    IReadOnlyList<PalWorkSuitability> WorkSuitabilities,
    string IconPath,
    int IconWidth,
    int IconHeight,
    string IconSha256,
    string PartnerSkillId,
    IReadOnlyList<SourceReference> Sources);

internal sealed record PalWorkSuitability(
    string Id,
    string NameKo,
    int Level);

internal sealed record SkillRecord(
    string Id,
    string GameId,
    string Kind,
    string NameKo,
    string DescriptionKo,
    string? RawDescriptionKo,
    IReadOnlyList<string> PalIds,
    IReadOnlyList<EffectRecord> Effects,
    int? Rank,
    SkillAvailability Availability,
    PassiveUiClassification? PassiveUi,
    IReadOnlyList<SourceReference> Sources);

internal sealed record SkillAvailability(
    string Kind,
    int? LotteryWeight,
    string? EvidenceKind);

internal sealed record PassiveUiClassification(
    string Family,
    string? StyleId,
    string EvidenceKind);

internal sealed record EffectRecord(
    string Id,
    string Metric,
    string? WorkSuitabilityId,
    string? WorkSuitabilityNameKo,
    IReadOnlyList<string> ApplicableWorkSuitabilityIds,
    string WorkApplicabilityEvidenceKind,
    decimal Value,
    string Unit,
    string Scope,
    IReadOnlyList<string> TargetPalIds,
    IReadOnlyList<string> TargetPalNamesKo,
    IReadOnlyList<string> ConditionPalIds,
    IReadOnlyList<string> ConditionPalNamesKo,
    bool? Stackable,
    IReadOnlyList<RankValue>? RankValues,
    string EvidenceKind,
    EffectRawFields Raw);

internal sealed record RankValue(
    int RankIndex,
    decimal Value);

internal sealed record EffectRawFields(
    string TargetType,
    bool? AssignOthers,
    bool? NotAssignSelf,
    bool? InvokeWorker,
    bool? InvokeInBaseCamp,
    bool? StackablePartnerSkillBySameTribe,
    IReadOnlyList<string> WorkTypes,
    IReadOnlyList<string> MapObjectIds);

internal sealed record SourceReference(
    string AssetPath,
    string RowId);

internal sealed record WorkSuitabilityResolution(
    string? Id,
    string EvidenceKind);

internal sealed record WorkApplicabilityResolution(
    IReadOnlyList<string> Ids,
    string EvidenceKind);

internal sealed record RawPartnerEffect(
    string Signature,
    string PassiveSkillId,
    int EntryIndex,
    int FieldIndex,
    string Metric,
    string? WorkSuitabilityId,
    string WorkSuitabilityEvidenceKind,
    decimal Value,
    string TargetType,
    string Scope,
    bool? AssignOthers,
    bool? NotAssignSelf,
    bool? InvokeWorker,
    bool? InvokeInBaseCamp,
    bool? StackableRaw,
    string RawWorkType,
    IReadOnlyList<string> MapObjectIds,
    IReadOnlyList<string> TargetPalIds,
    IReadOnlyList<string> ConditionPalIds);

internal sealed record PartnerEffectGroup(
    string Signature,
    string Metric,
    string? WorkSuitabilityId,
    string WorkSuitabilityEvidenceKind,
    decimal Value,
    string TargetType,
    string Scope,
    bool? AssignOthers,
    bool? NotAssignSelf,
    bool? InvokeWorker,
    bool? InvokeInBaseCamp,
    bool? StackableRaw,
    IReadOnlyList<string> TargetPalIds,
    IReadOnlyList<string> ConditionPalIds,
    IReadOnlyList<string> RawWorkTypes,
    IReadOnlyList<string> MapObjectIds,
    IReadOnlyList<RawPartnerEffect> RawEffects);
