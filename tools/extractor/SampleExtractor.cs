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

internal static partial class SampleExtractor
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
    private const string PartnerDescriptionPath =
        "Pal/Content/L10N/ko/Pal/DataTable/Text/" +
        "DT_PalFirstActivatedInfoText";
    private const string CommonTextPath =
        "Pal/Content/L10N/ko/Pal/DataTable/Text/DT_UI_Common_Text_Common";

    private static readonly string[] SamplePalIds =
    [
        "PinkRabbit",
        "CatMage_Fire",
        "ClioneTwins",
        "CubeTurtle",
        "ElecPomeranian",
    ];

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

    private static readonly string[] SourceAssetPaths =
    [
        MonsterParameterPath,
        IconTablePath,
        PartnerParameterPath,
        PassiveSkillPath,
        PalNamePath,
        SkillNamePath,
        PartnerDescriptionPath,
        CommonTextPath,
    ];

    private static readonly JsonSerializerSettings OutputJsonSettings = new()
    {
        Formatting = Formatting.Indented,
        ContractResolver = new CamelCasePropertyNamesContractResolver(),
    };

    [GeneratedRegex(
        @"<uiCommon\b[^>]*\bid=\|(?<id>[^|]+)\|[^>]*/>",
        RegexOptions.CultureInvariant)]
    private static partial Regex UiCommonTagRegex();

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
        string outputDirectory)
    {
        var absoluteOutputDirectory =
            Program.ResolveSafeOutputPath(pakDirectory, outputDirectory);
        var (provider, mountedArchiveCount) =
            Program.OpenProvider(pakDirectory, mappingPath);

        using (provider)
        {
            var tables = SourceAssetPaths.ToDictionary(
                assetPath => assetPath,
                assetPath => LoadRows(provider, assetPath),
                StringComparer.Ordinal);
            var pals = SamplePalIds
                .Select(
                    palId => ExtractPal(
                        provider,
                        palId,
                        absoluteOutputDirectory,
                        tables))
                .ToArray();

            ValidateSample(pals);
            Directory.CreateDirectory(absoluteOutputDirectory);

            var dataset = new SampleDataset(
                "0.1.0-sample",
                ReadMetadata(
                    pakDirectory,
                    mappingPath,
                    mountedArchiveCount),
                pals,
                new SampleValidation(
                    pals.Length,
                    pals.Select(pal => pal.Id).Distinct(
                        StringComparer.Ordinal).Count(),
                    pals.Count(pal => File.Exists(
                        Path.Combine(
                            absoluteOutputDirectory,
                            pal.Icon.RelativePath.Replace(
                                '/',
                                Path.DirectorySeparatorChar)))),
                    pals.Sum(pal => pal.PartnerSkill.BaseWorkEffects.Count),
                    []));

            var outputPath =
                Path.Combine(absoluteOutputDirectory, "sample.json");
            File.WriteAllText(
                outputPath,
                JsonConvert.SerializeObject(dataset, OutputJsonSettings),
                new UTF8Encoding(false));

            Console.WriteLine(
                JsonConvert.SerializeObject(
                    new
                    {
                        OutputPath = outputPath,
                        PalCount = pals.Length,
                        EffectCount = pals.Sum(
                            pal => pal.PartnerSkill.BaseWorkEffects.Count),
                        IconCount = pals.Count(
                            pal => File.Exists(
                                Path.Combine(
                                    absoluteOutputDirectory,
                                    pal.Icon.RelativePath.Replace(
                                        '/',
                                        Path.DirectorySeparatorChar)))),
                        MountedArchiveCount = mountedArchiveCount,
                    },
                    Formatting.Indented));
        }

        return 0;
    }

    private static SamplePal ExtractPal(
        DefaultFileProvider provider,
        string palId,
        string outputDirectory,
        IReadOnlyDictionary<
            string,
            IReadOnlyDictionary<string, JObject>> tables)
    {
        var monster = RequireRow(
            tables[MonsterParameterPath],
            palId,
            MonsterParameterPath);
        var icon = RequireRow(tables[IconTablePath], palId, IconTablePath);
        var partnerParameter = RequireRow(
            tables[PartnerParameterPath],
            palId,
            PartnerParameterPath);

        var nameTextId = ResolveTextId(
            monster,
            "OverrideNameTextID",
            $"PAL_NAME_{palId}");
        var partnerNameTextId = ResolveTextId(
            monster,
            "OverridePartnerSkillNameTextID",
            $"PARTNERSKILL_{palId}");
        var partnerDescriptionTextId = ResolveTextId(
            monster,
            "OverridePartnerSkillDescTextID",
            $"PAL_FIRST_SPAWN_DESC_{palId}");
        var nameKo = RequireLocalizedText(
            tables[PalNamePath],
            nameTextId,
            PalNamePath);
        var partnerNameKo = RequireLocalizedText(
            tables[SkillNamePath],
            partnerNameTextId,
            SkillNamePath);
        var rawPartnerDescriptionKo = RequireLocalizedText(
            tables[PartnerDescriptionPath],
            partnerDescriptionTextId,
            PartnerDescriptionPath);

        var workSuitabilities = WorkSuitabilityIds
            .Select(
                suitabilityId => new SampleWorkSuitability(
                    suitabilityId,
                    RequireLocalizedText(
                        tables[CommonTextPath],
                        $"COMMON_WORK_SUITABILITY_{suitabilityId}",
                        CommonTextPath),
                    monster.Value<int?>(
                        $"WorkSuitability_{suitabilityId}") ?? 0))
            .Where(suitability => suitability.Level > 0)
            .ToArray();

        var rankOneEntries = RequireArray(
            partnerParameter.SelectToken(
                "PassiveSkills[0].SkillAndParametersArray"),
            $"{palId} partner rank 1 passive entries");
        var renderedPartnerDescriptionKo = RenderDescription(
            rawPartnerDescriptionKo,
            rankOneEntries,
            tables[PassiveSkillPath],
            tables[CommonTextPath]);
        var baseWorkEffects = ExtractBaseWorkEffects(
            palId,
            partnerDescriptionTextId,
            rawPartnerDescriptionKo,
            partnerParameter,
            tables[PassiveSkillPath],
            tables[CommonTextPath]);

        var iconObjectPath = RequireString(
            icon.SelectToken("Icon.AssetPathName"),
            $"{palId} icon object path");
        var iconAssetPath = ConvertObjectPathToPackagePath(iconObjectPath);
        var iconRelativePath = $"icons/{palId}.png";
        var iconOutputPath = Path.Combine(
            outputDirectory,
            iconRelativePath.Replace('/', Path.DirectorySeparatorChar));
        var iconResult =
            TextureExporter.WritePng(provider, iconAssetPath, iconOutputPath);
        var iconSha256 = Convert.ToHexString(
            SHA256.HashData(File.ReadAllBytes(iconOutputPath)))
            .ToLowerInvariant();

        return new SamplePal(
            palId,
            monster.Value<int?>("ZukanIndex"),
            monster.Value<string>("ZukanIndexSuffix") ?? string.Empty,
            nameKo,
            null,
            workSuitabilities,
            new SampleIcon(
                iconRelativePath,
                iconResult.Width,
                iconResult.Height,
                iconSha256,
                new SampleSource(IconTablePath, palId),
                new SampleSource(iconAssetPath, palId)),
            new SamplePartnerSkill(
                partnerNameTextId,
                partnerNameKo,
                renderedPartnerDescriptionKo,
                rawPartnerDescriptionKo,
                baseWorkEffects,
                new SampleSource(SkillNamePath, partnerNameTextId),
                new SampleSource(
                    PartnerDescriptionPath,
                    partnerDescriptionTextId)),
            new SampleSource(MonsterParameterPath, palId),
            new SampleSource(PalNamePath, nameTextId));
    }

    private static IReadOnlyList<SampleBaseWorkEffect> ExtractBaseWorkEffects(
        string palId,
        string partnerDescriptionTextId,
        string rawPartnerDescriptionKo,
        JObject partnerParameter,
        IReadOnlyDictionary<string, JObject> passiveRows,
        IReadOnlyDictionary<string, JObject> commonTextRows)
    {
        var passiveRanks = RequireArray(
            partnerParameter["PassiveSkills"],
            $"{palId} partner passive ranks");
        if (passiveRanks.Count != 5)
        {
            throw new InvalidDataException(
                $"{palId} has {passiveRanks.Count} partner passive ranks; " +
                "expected 5.");
        }

        var rankOneEntries = RequireArray(
            passiveRanks[0]?["SkillAndParametersArray"],
            $"{palId} partner rank 1 passive entries");
        var effects = new List<SampleBaseWorkEffect>();

        foreach (var entry in rankOneEntries)
        {
            var passiveSkillId = RequireString(
                entry.SelectToken("SkillName.Key"),
                $"{palId} passive skill id");
            var passive = RequireRow(
                passiveRows,
                passiveSkillId,
                PassiveSkillPath);

            for (var effectIndex = 1; effectIndex <= 4; effectIndex++)
            {
                var effectType = EnumSuffix(
                    passive.Value<string>($"EffectType{effectIndex}"));
                const string prefix = "WorkSuitabilityAddRank_";
                if (!effectType.StartsWith(
                        prefix,
                        StringComparison.Ordinal))
                {
                    continue;
                }

                var suitabilityId = effectType[prefix.Length..];
                var rankValues = passiveRanks
                    .Select(
                        (rank, rankIndex) => new SampleRankValue(
                            rankIndex,
                            FindEffectValueForRank(
                                palId,
                                rank,
                                effectType,
                                passiveRows)))
                    .ToArray();
                var parameters = entry["Parameters"] as JObject
                    ?? throw new InvalidDataException(
                        $"{palId} passive assignment parameters are missing.");
                var targetType = EnumSuffix(
                    passive.Value<string>($"TargetType{effectIndex}"));
                var notAssignSelf =
                    parameters.Value<bool?>("bNotAssignSelf");
                var assignOthers =
                    parameters.Value<bool?>("AssignOthers");
                var invokeInBaseCamp =
                    passive.Value<bool?>("InvokeInBaseCamp");
                var stackable =
                    passive.Value<bool?>(
                        "IsStackablePartnerSkillBySameTribe");
                var scope = ResolveScope(
                    targetType,
                    notAssignSelf,
                    rawPartnerDescriptionKo);

                effects.Add(
                    new SampleBaseWorkEffect(
                        passiveSkillId,
                        "work_suitability_rank",
                        suitabilityId,
                        RequireLocalizedText(
                            commonTextRows,
                            $"COMMON_WORK_SUITABILITY_{suitabilityId}",
                            CommonTextPath),
                        rankValues[0].Value,
                        rankValues,
                        scope,
                        stackable,
                        targetType,
                        assignOthers,
                        notAssignSelf,
                        invokeInBaseCamp,
                        "structured_and_localized_text",
                        new SampleEffectEvidence(
                            new SampleSource(
                                PassiveSkillPath,
                                passiveSkillId),
                            new SampleSource(
                                PartnerParameterPath,
                                palId),
                            new SampleSource(
                                PartnerDescriptionPath,
                                partnerDescriptionTextId))));
            }
        }

        return effects;
    }

    private static decimal FindEffectValueForRank(
        string palId,
        JToken? rank,
        string expectedEffectType,
        IReadOnlyDictionary<string, JObject> passiveRows)
    {
        var entries = RequireArray(
            rank?["SkillAndParametersArray"],
            $"{palId} partner passive rank entries");
        var values = new List<decimal>();

        foreach (var entry in entries)
        {
            var passiveSkillId = RequireString(
                entry.SelectToken("SkillName.Key"),
                $"{palId} ranked passive skill id");
            var passive = RequireRow(
                passiveRows,
                passiveSkillId,
                PassiveSkillPath);

            for (var effectIndex = 1; effectIndex <= 4; effectIndex++)
            {
                if (!EnumSuffix(
                        passive.Value<string>($"EffectType{effectIndex}"))
                    .Equals(expectedEffectType, StringComparison.Ordinal))
                {
                    continue;
                }

                values.Add(
                    passive.Value<decimal?>($"EffectValue{effectIndex}")
                    ?? throw new InvalidDataException(
                        $"{passiveSkillId} is missing EffectValue" +
                        $"{effectIndex}."));
            }
        }

        return values.Count == 1
            ? values[0]
            : throw new InvalidDataException(
                $"{palId} rank has {values.Count} matches for " +
                $"{expectedEffectType}; expected exactly 1.");
    }

    private static string RenderDescription(
        string rawDescription,
        JArray rankOneEntries,
        IReadOnlyDictionary<string, JObject> passiveRows,
        IReadOnlyDictionary<string, JObject> commonTextRows)
    {
        var placeholders = new Dictionary<string, string>(
            StringComparer.Ordinal);

        for (var passiveIndex = 0;
             passiveIndex < rankOneEntries.Count;
             passiveIndex++)
        {
            var passiveSkillId = RequireString(
                rankOneEntries[passiveIndex]?.SelectToken("SkillName.Key"),
                $"rank 1 passive skill id at index {passiveIndex}");
            var passive = RequireRow(
                passiveRows,
                passiveSkillId,
                PassiveSkillPath);

            for (var effectIndex = 1; effectIndex <= 4; effectIndex++)
            {
                var value = passive.Value<decimal?>(
                    $"EffectValue{effectIndex}");
                if (value is null)
                {
                    continue;
                }

                placeholders[
                    $"Passive{passiveIndex + 1}_EffectValue{effectIndex}"] =
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
        rendered = RemainingMarkupRegex().Replace(rendered, string.Empty);

        return string.Join(
            '\n',
            rendered
                .Replace("\r\n", "\n", StringComparison.Ordinal)
                .Split('\n')
                .Select(line => line.Trim())
                .Where(line => line.Length > 0));
    }

    private static string ResolveScope(
        string targetType,
        bool? notAssignSelf,
        string rawDescriptionKo)
    {
        if (targetType == "ToBaseCampPal"
            && notAssignSelf is true
            && rawDescriptionKo.Contains(
                "다른 거점 팰",
                StringComparison.Ordinal))
        {
            return "other_base_pals";
        }

        return "unknown";
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
        if (!packagePath.StartsWith(
                gamePrefix,
                StringComparison.Ordinal))
        {
            throw new InvalidDataException(
                $"Unsupported icon object path: {objectPath}");
        }

        return "Pal/Content/" + packagePath[gamePrefix.Length..];
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

        var localized = row.SelectToken(
            "TextData.LocalizedString")?.Value<string>();
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

    private static void ValidateSample(IReadOnlyList<SamplePal> pals)
    {
        if (pals.Count != SamplePalIds.Length)
        {
            throw new InvalidDataException(
                $"Extracted {pals.Count} pals; expected {SamplePalIds.Length}.");
        }

        if (pals.Select(pal => pal.Id).Distinct(
                StringComparer.Ordinal).Count() != pals.Count)
        {
            throw new InvalidDataException(
                "The sample contains duplicate pal IDs.");
        }

        foreach (var pal in pals)
        {
            if (string.IsNullOrWhiteSpace(pal.NameKo)
                || string.IsNullOrWhiteSpace(pal.PartnerSkill.NameKo)
                || string.IsNullOrWhiteSpace(
                    pal.PartnerSkill.DescriptionKo))
            {
                throw new InvalidDataException(
                    $"{pal.Id} has missing Korean text.");
            }

            if (pal.Icon.Width <= 0
                || pal.Icon.Height <= 0
                || pal.Icon.Sha256.Length != 64)
            {
                throw new InvalidDataException(
                    $"{pal.Id} has invalid icon metadata.");
            }

            if (pal.WorkSuitabilities.Count == 0)
            {
                throw new InvalidDataException(
                    $"{pal.Id} has no base work suitability.");
            }

            if (pal.PartnerSkill.BaseWorkEffects.Count == 0)
            {
                throw new InvalidDataException(
                    $"{pal.Id} has no normalized base-work partner effect.");
            }

            foreach (var effect in pal.PartnerSkill.BaseWorkEffects)
            {
                if (effect.RankValues.Count != 5
                    || effect.RankValues.Select(
                        value => value.RankIndex).Distinct().Count() != 5
                    || effect.RankValues.Any(value => value.Value <= 0))
                {
                    throw new InvalidDataException(
                        $"{pal.Id}/{effect.Id} has invalid rank values.");
                }
            }
        }
    }

    private static SampleMetadata ReadMetadata(
        string pakDirectory,
        string mappingPath,
        int mountedArchiveCount)
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

        return new SampleMetadata(
            "1623730",
            ReadManifestValue(manifest, "buildid") ?? "unknown",
            ReadManifestValue(manifest, "language") ?? "unknown",
            "ko",
            "1.0",
            "5.1.1",
            DateTimeOffset.UtcNow,
            pakInfo.FullName,
            pakInfo.Length,
            pakInfo.LastWriteTimeUtc,
            Path.GetFileName(mappingPath),
            Convert.ToHexString(
                SHA256.HashData(File.ReadAllBytes(mappingPath)))
                .ToLowerInvariant(),
            mountedArchiveCount,
            SourceAssetPaths);
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
}

internal sealed record SampleDataset(
    string SchemaVersion,
    SampleMetadata Metadata,
    IReadOnlyList<SamplePal> Pals,
    SampleValidation Validation);

internal sealed record SampleMetadata(
    string SteamAppId,
    string SteamBuildId,
    string SteamLanguage,
    string Localization,
    string GameRelease,
    string EngineVersion,
    DateTimeOffset ExtractedAtUtc,
    string PakPath,
    long PakSize,
    DateTime PakModifiedAtUtc,
    string MappingFileName,
    string MappingSha256,
    int MountedArchiveCount,
    IReadOnlyList<string> SourceAssets);

internal sealed record SamplePal(
    string Id,
    int? PaldeckNo,
    string PaldeckSuffix,
    string NameKo,
    string? NameEn,
    IReadOnlyList<SampleWorkSuitability> WorkSuitabilities,
    SampleIcon Icon,
    SamplePartnerSkill PartnerSkill,
    SampleSource MonsterSource,
    SampleSource NameSource);

internal sealed record SampleWorkSuitability(
    string Id,
    string NameKo,
    int Level);

internal sealed record SampleIcon(
    string RelativePath,
    int Width,
    int Height,
    string Sha256,
    SampleSource MappingSource,
    SampleSource TextureSource);

internal sealed record SamplePartnerSkill(
    string Id,
    string NameKo,
    string DescriptionKo,
    string RawDescriptionKo,
    IReadOnlyList<SampleBaseWorkEffect> BaseWorkEffects,
    SampleSource NameSource,
    SampleSource DescriptionSource);

internal sealed record SampleBaseWorkEffect(
    string Id,
    string Kind,
    string WorkSuitabilityId,
    string WorkSuitabilityNameKo,
    decimal SuitabilityDelta,
    IReadOnlyList<SampleRankValue> RankValues,
    string EffectScope,
    bool? Stackable,
    string TargetTypeRaw,
    bool? AssignOthersRaw,
    bool? NotAssignSelfRaw,
    bool? InvokeInBaseCampRaw,
    string EvidenceKind,
    SampleEffectEvidence Evidence);

internal sealed record SampleRankValue(
    int RankIndex,
    decimal Value);

internal sealed record SampleEffectEvidence(
    SampleSource StructuredEffect,
    SampleSource PartnerAssignment,
    SampleSource LocalizedDescription);

internal sealed record SampleSource(
    string AssetPath,
    string RowId);

internal sealed record SampleValidation(
    int PalCount,
    int UniquePalIdCount,
    int ExistingIconCount,
    int BaseWorkEffectCount,
    IReadOnlyList<string> Errors);
