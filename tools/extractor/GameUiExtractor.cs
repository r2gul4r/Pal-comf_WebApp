using System.Security.Cryptography;
using System.Text.RegularExpressions;
using CUE4Parse.FileProvider;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace PalAuto.Extractor;

internal static partial class GameUiExtractor
{
    internal const string PassiveWidgetAssetPath =
        "Pal/Content/Pal/Blueprint/UI/UserInterface/MainMenu/Pal/" +
        "WBP_MainMenu_Pal_Skill_Passive";

    private const string WorkIconWidgetAssetPath =
        "Pal/Content/Pal/Blueprint/UI/UserInterface/InGame/EnemyGauge/" +
        "WBP_IconPalWork";

    private static readonly IReadOnlyDictionary<string, string>
        PassiveTextureAssetPaths = new Dictionary<string, string>(
            StringComparer.Ordinal)
        {
            ["frame"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_prt_pal_skill_base_00",
            ["frameOverlay"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_prt_pal_skill_base_01",
            ["prismBand"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_prt_pal_skill_base_02",
            ["prismTriangle"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_prt_menu_pal_base_tri",
            ["backgroundGradient"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/T_prt_menu_bggrd",
            ["rankArrow0"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_icon_skillstatus_rank_arrow_00",
            ["rankArrow1"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_icon_skillstatus_rank_arrow_01",
            ["rankArrow2"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_icon_skillstatus_rank_arrow_02",
            ["rankArrow3"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_icon_skillstatus_rank_arrow_03",
            ["rankArrow4"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_icon_skillstatus_rank_arrow_04",
            ["rankArrow5"] =
                "Pal/Content/Pal/Texture/UI/Main_Menu/" +
                "T_icon_skillstatus_rank_arrow_05",
            ["worldTreeDissolve"] =
                "Pal/Content/Pal/Material/UI/Texture/" +
                "T_UI_BossBattle_RG",
            ["worldTreeDissolveTarget"] =
                "Pal/Content/Pal/Texture/UI/Common/" +
                "T_prt_BGParticle_Mask_0",
            ["worldTreeScroll"] =
                "Pal/Content/Pal/Texture/UI/InGame/" +
                "T_prt_gameover_uvscroll_0",
            ["worldTreeScrollMask"] =
                "Pal/Content/Pal/Texture/UI/InGame/" +
                "T_prt_gameover_mask_0",
        };

    private static readonly string[] ObsoletePassiveTextureFileNames =
    [
        "rankArrow.png",
        "worldTreeMask.png",
    ];

    private static readonly WorldTreeLayerSpec[] WorldTreeLayerSpecs =
    [
        new(
            "dissolve",
            "SkillBase_Eff_Curse",
            ["worldTreeDissolve", "worldTreeDissolveTarget"]),
        new(
            "scroll_slow",
            "SkillBase_Eff_Curse_1",
            ["worldTreeScroll", "worldTreeScrollMask"]),
        new(
            "scroll_fast",
            "SkillBase_Eff_Curse_2",
            ["worldTreeScroll", "worldTreeScrollMask"]),
        new(
            "base_gradient",
            "SkillBase_Eff_Curse_3",
            []),
    ];

    private static readonly PassiveStyleSpec[] PassiveStyleSpecs =
    [
        new(
            "common",
            "일반 패시브",
            "Anm_Buff_Normal"),
        new(
            "common_negative",
            "일반 패시브 · 디버프",
            "Anm_Debuff_Normal"),
        new(
            "rare_yellow",
            "노란 패시브",
            "Anm_Rare_Normal"),
        new(
            "rare2_blue",
            "파란 패시브",
            "Anm_Rare2_Normal"),
        new(
            "world_tree",
            "세계수 패시브",
            "Anm_Rare3_Normal"),
    ];

    [GeneratedRegex(@"\.(?<index>\d+)$", RegexOptions.CultureInvariant)]
    private static partial Regex ExportIndexRegex();

    public static UiExtractionResult Extract(
        DefaultFileProvider provider,
        string projectRoot,
        IReadOnlyList<WorkSuitabilityDefinition> workSuitabilities)
    {
        DeleteObsoletePassiveTextures(projectRoot);
        var workIconAssetPaths = ReadWorkIconAssetPaths(provider);
        var workSuitabilitiesWithIcons = workSuitabilities
            .Select(
                definition => workIconAssetPaths.TryGetValue(
                    definition.Id,
                    out var assetPath)
                    ? definition with
                    {
                        Icon = ExportTexture(
                            provider,
                            projectRoot,
                            assetPath,
                            $"/generated/ui/work-suitabilities/" +
                            $"{definition.Id}.png"),
                    }
                    : definition)
            .ToArray();

        var passiveTextures = PassiveTextureAssetPaths.ToDictionary(
            entry => entry.Key,
            entry => ExportTexture(
                provider,
                projectRoot,
                entry.Value,
                $"/generated/ui/passive/{entry.Key}.png"),
            StringComparer.Ordinal);
        var passiveWidgetExports = LoadPackageExports(
            provider,
            PassiveWidgetAssetPath);
        var passiveStyles = ExtractPassiveStyles(passiveWidgetExports);
        var worldTreeEffect = ExtractWorldTreeEffect(passiveWidgetExports);
        var sourceAssets = workIconAssetPaths.Values
            .Concat(PassiveTextureAssetPaths.Values)
            .Concat(
                worldTreeEffect.Layers.Select(
                    layer => layer.MaterialAssetPath))
            .Append(WorkIconWidgetAssetPath)
            .Append(PassiveWidgetAssetPath)
            .Distinct(StringComparer.Ordinal)
            .OrderBy(path => path, StringComparer.Ordinal)
            .ToArray();

        return new UiExtractionResult(
            workSuitabilitiesWithIcons,
            new GameUiAssets(
                PassiveWidgetAssetPath,
                passiveTextures,
                passiveStyles,
                worldTreeEffect,
                [],
                sourceAssets));
    }

    private static void DeleteObsoletePassiveTextures(string projectRoot)
    {
        var passiveOutputDirectory = Path.Combine(
            projectRoot,
            "public",
            "generated",
            "ui",
            "passive");
        foreach (var fileName in ObsoletePassiveTextureFileNames)
        {
            File.Delete(Path.Combine(passiveOutputDirectory, fileName));
        }
    }

    private static IReadOnlyDictionary<string, string>
        ReadWorkIconAssetPaths(DefaultFileProvider provider)
    {
        var exports = LoadPackageExports(provider, WorkIconWidgetAssetPath);
        var defaults = FindExport(exports, "Default__WBP_IconPalWork_C");
        var iconMap = defaults.SelectToken("Properties.IconMap") as JArray
            ?? throw new InvalidDataException(
                $"{WorkIconWidgetAssetPath} has no IconMap.");

        return iconMap
            .OfType<JObject>()
            .Select(ReadWorkIconMapEntry)
            .Where(entry => entry.Id != "Anyone")
            .ToDictionary(
                entry => entry.Id,
                entry => entry.AssetPath,
                StringComparer.Ordinal);
    }

    private static WorkIconMapEntry ReadWorkIconMapEntry(JObject entry)
    {
        const string enumPrefix = "EPalWorkSuitability::";
        var key = entry.Value<string>("Key")
            ?? throw new InvalidDataException("Work icon map entry has no key.");
        if (!key.StartsWith(enumPrefix, StringComparison.Ordinal))
        {
            throw new InvalidDataException(
                $"Unexpected work icon map key: {key}");
        }

        var objectPath = entry.SelectToken("Value.ObjectPath")
                ?.Value<string>()
            ?? throw new InvalidDataException(
                $"Work icon map entry has no texture: {key}");
        return new WorkIconMapEntry(
            key[enumPrefix.Length..],
            StripExportIndex(objectPath, "Work icon texture path"));
    }

    private static JObject[] LoadPackageExports(
        DefaultFileProvider provider,
        string assetPath)
    {
        var package = provider.LoadPackage(assetPath);
        return package.GetExports()
            .Select(
                export => JObject.Parse(
                    JsonConvert.SerializeObject(export)))
            .ToArray();
    }

    private static GeneratedImageAsset ExportTexture(
        DefaultFileProvider provider,
        string projectRoot,
        string assetPath,
        string webPath)
    {
        var outputPath = Path.Combine(
            projectRoot,
            "public",
            webPath.TrimStart('/')
                .Replace('/', Path.DirectorySeparatorChar));
        var result = TextureExporter.WritePng(
            provider,
            assetPath,
            outputPath);
        var sha256 = Convert.ToHexString(
            SHA256.HashData(File.ReadAllBytes(outputPath)))
            .ToLowerInvariant();

        return new GeneratedImageAsset(
            webPath,
            result.Width,
            result.Height,
            sha256,
            assetPath);
    }

    private static IReadOnlyList<PassiveUiStyleDefinition>
        ExtractPassiveStyles(IReadOnlyList<JObject> exports)
    {
        return PassiveStyleSpecs
            .Select(spec => ReadPassiveStyle(exports, spec))
            .ToArray();
    }

    private static WorldTreeUiEffectDefinition ExtractWorldTreeEffect(
        IReadOnlyList<JObject> exports)
    {
        var layers = WorldTreeLayerSpecs
            .Select(
                spec =>
                {
                    var widget = FindExport(exports, spec.WidgetName);
                    var color = ReadColor(
                        RequireObject(
                            widget.SelectToken(
                                "Properties.ColorAndOpacity"),
                            $"{spec.WidgetName} default ColorAndOpacity"),
                        $"{spec.WidgetName} default color");
                    var brushTintAlpha = widget.SelectToken(
                                "Properties.Brush.TintColor." +
                                "SpecifiedColor.A")
                            ?.Value<double?>()
                        ?? 1.0;
                    var materialObjectPath = widget.SelectToken(
                                "Properties.Brush.ResourceObject.ObjectPath")
                            ?.Value<string>()
                        ?? throw new InvalidDataException(
                            $"{spec.WidgetName} has no brush material.");

                    return new WorldTreeUiLayerDefinition(
                        spec.Id,
                        spec.WidgetName,
                        StripExportIndex(
                            materialObjectPath,
                            $"{spec.WidgetName} brush material"),
                        color,
                        brushTintAlpha,
                        spec.TextureKeys);
                })
            .ToArray();

        return new WorldTreeUiEffectDefinition(
            "Overlay_CurseEff",
            ReadAnimatedOpacity(
                exports,
                "Anm_Rare3_Normal",
                "Overlay_CurseEff"),
            layers,
            "widget_material");
    }

    private static PassiveUiStyleDefinition ReadPassiveStyle(
        IReadOnlyList<JObject> exports,
        PassiveStyleSpec spec)
    {
        return new PassiveUiStyleDefinition(
            spec.Id,
            spec.NameKo,
            spec.AnimationName,
            ReadAnimatedColor(
                exports,
                spec.AnimationName,
                "SkillBase"),
            ReadAnimatedColor(
                exports,
                spec.AnimationName,
                "SkillBase_1"),
            ReadAnimatedOpacity(
                exports,
                spec.AnimationName,
                "SkillBase_1"),
            ReadAnimatedColor(
                exports,
                spec.AnimationName,
                "Base"),
            ReadAnimatedColor(
                exports,
                spec.AnimationName,
                "Text_SkillName"),
            ReadAnimatedColor(
                exports,
                spec.AnimationName,
                "IconRankArrow"),
            ReadAnimatedColor(
                exports,
                spec.AnimationName,
                "Base_Grd"),
            ReadAnimatedOpacity(
                exports,
                spec.AnimationName,
                "Base_Grd"),
            ReadAnimatedColor(
                exports,
                spec.AnimationName,
                "SkillBase_Eff"),
            ReadAnimatedOpacity(
                exports,
                spec.AnimationName,
                "SkillBase_Eff"),
            ReadAnimatedOpacity(
                exports,
                spec.AnimationName,
                "HorizontalBox_1"),
            ReadAnimatedOpacity(
                exports,
                spec.AnimationName,
                "Overlay_CurseEff"),
            "widget_animation");
    }

    private static UiColorDefinition ReadAnimatedColor(
        IReadOnlyList<JObject> exports,
        string animationName,
        string widgetName)
    {
        var track = TryFindTrack(
            exports,
            animationName,
            widgetName,
            "ColorAndOpacity");
        if (track is null)
        {
            var widget = FindExport(exports, widgetName);
            var fallback = RequireObject(
                widget.SelectToken("Properties.ColorAndOpacity"),
                $"{widgetName} default ColorAndOpacity");
            return ReadColor(fallback, $"{widgetName} default color");
        }

        var section = ResolveFirstSection(exports, track);
        var properties = RequireObject(
            section["Properties"],
            $"{animationName}/{widgetName} color section properties");
        var red = RequireFirstCurveValue(properties, "RedCurve");
        var green = RequireFirstCurveValue(properties, "GreenCurve");
        var blue = RequireFirstCurveValue(properties, "BlueCurve");
        var alpha = RequireFirstCurveValue(properties, "AlphaCurve");
        return new UiColorDefinition(
            red,
            green,
            blue,
            alpha,
            ToCssHex(red, green, blue, alpha));
    }

    private static double ReadAnimatedOpacity(
        IReadOnlyList<JObject> exports,
        string animationName,
        string widgetName)
    {
        var track = TryFindTrack(
            exports,
            animationName,
            widgetName,
            "RenderOpacity");
        if (track is null)
        {
            var widget = FindExport(exports, widgetName);
            return widget.SelectToken("Properties.RenderOpacity")
                       ?.Value<double?>()
                   ?? 1.0;
        }

        var section = ResolveFirstSection(exports, track);
        return section.SelectToken(
                    "Properties.FloatCurve.Values[0].Value")
                ?.Value<double?>()
            ?? throw new InvalidDataException(
                $"{animationName}/{widgetName} has no opacity curve value.");
    }

    private static JObject? TryFindTrack(
        IReadOnlyList<JObject> exports,
        string animationName,
        string widgetName,
        string propertyName)
    {
        var animation = FindExport(exports, animationName);
        var bindings = animation.SelectToken("Properties.ObjectBindings")
            as JArray
            ?? throw new InvalidDataException(
                $"{animationName} has no object bindings.");
        var binding = bindings
            .OfType<JObject>()
            .SingleOrDefault(
                candidate => candidate.Value<string>("BindingName")
                    == widgetName);
        if (binding?["Tracks"] is not JArray trackReferences)
        {
            return null;
        }

        foreach (var trackReference in trackReferences.OfType<JObject>())
        {
            var track = ResolveExport(exports, trackReference);
            if (track.SelectToken("Properties.PropertyBinding.PropertyName")
                    ?.Value<string>()
                == propertyName)
            {
                return track;
            }
        }

        return null;
    }

    private static JObject ResolveFirstSection(
        IReadOnlyList<JObject> exports,
        JObject track)
    {
        var sectionReference = track.SelectToken("Properties.Sections[0]")
            as JObject
            ?? throw new InvalidDataException(
                $"{track.Value<string>("Name")} has no section.");
        return ResolveExport(exports, sectionReference);
    }

    private static JObject ResolveExport(
        IReadOnlyList<JObject> exports,
        JObject reference)
    {
        var objectPath = reference.Value<string>("ObjectPath")
            ?? throw new InvalidDataException(
                "Package export reference has no object path.");
        var match = ExportIndexRegex().Match(objectPath);
        if (!match.Success
            || !int.TryParse(
                match.Groups["index"].Value,
                out var index)
            || index < 0
            || index >= exports.Count)
        {
            throw new InvalidDataException(
                $"Package export reference has an invalid index: " +
                objectPath);
        }

        return exports[index];
    }

    private static JObject FindExport(
        IReadOnlyList<JObject> exports,
        string name)
    {
        return exports.SingleOrDefault(
                export => export.Value<string>("Name") == name)
            ?? throw new InvalidDataException(
                $"Passive UI widget export not found: {name}");
    }

    private static string StripExportIndex(
        string objectPath,
        string label)
    {
        var match = ExportIndexRegex().Match(objectPath);
        if (!match.Success)
        {
            throw new InvalidDataException(
                $"{label} has no export index: {objectPath}");
        }

        return objectPath[..match.Index];
    }

    private static JObject RequireObject(JToken? token, string label)
    {
        return token as JObject
            ?? throw new InvalidDataException($"{label} is not an object.");
    }

    private static double RequireFirstCurveValue(
        JObject properties,
        string curveName)
    {
        return properties.SelectToken($"{curveName}.Values[0].Value")
                ?.Value<double?>()
            ?? throw new InvalidDataException(
                $"{curveName} has no first value.");
    }

    private static UiColorDefinition ReadColor(
        JObject color,
        string label)
    {
        var red = color.Value<double?>("R")
            ?? throw new InvalidDataException($"{label} has no R value.");
        var green = color.Value<double?>("G")
            ?? throw new InvalidDataException($"{label} has no G value.");
        var blue = color.Value<double?>("B")
            ?? throw new InvalidDataException($"{label} has no B value.");
        var alpha = color.Value<double?>("A")
            ?? throw new InvalidDataException($"{label} has no A value.");
        return new UiColorDefinition(
            red,
            green,
            blue,
            alpha,
            ToCssHex(red, green, blue, alpha));
    }

    private static string ToCssHex(
        double red,
        double green,
        double blue,
        double alpha)
    {
        return $"#{LinearToSrgbByte(red):X2}" +
               $"{LinearToSrgbByte(green):X2}" +
               $"{LinearToSrgbByte(blue):X2}" +
               $"{ToByte(alpha):X2}";
    }

    private static int LinearToSrgbByte(double value)
    {
        var clamped = Math.Clamp(value, 0.0, 1.0);
        var srgb = clamped <= 0.0031308
            ? clamped * 12.92
            : 1.055 * Math.Pow(clamped, 1.0 / 2.4) - 0.055;
        return ToByte(srgb);
    }

    private static int ToByte(double value)
    {
        return (int)Math.Round(
            Math.Clamp(value, 0.0, 1.0) * 255.0,
            MidpointRounding.AwayFromZero);
    }

    private sealed record PassiveStyleSpec(
        string Id,
        string NameKo,
        string AnimationName);

    private sealed record WorldTreeLayerSpec(
        string Id,
        string WidgetName,
        IReadOnlyList<string> TextureKeys);

    private sealed record WorkIconMapEntry(string Id, string AssetPath);
}

internal sealed record UiExtractionResult(
    IReadOnlyList<WorkSuitabilityDefinition> WorkSuitabilities,
    GameUiAssets UiAssets);

internal sealed record GeneratedImageAsset(
    string Path,
    int Width,
    int Height,
    string Sha256,
    string SourceAssetPath);

internal sealed record UiColorDefinition(
    double LinearR,
    double LinearG,
    double LinearB,
    double Alpha,
    string CssHex);

internal sealed record PassiveUiStyleDefinition(
    string Id,
    string NameKo,
    string AnimationName,
    UiColorDefinition FrameColor,
    UiColorDefinition FrameOverlayColor,
    double FrameOverlayOpacity,
    UiColorDefinition BackgroundColor,
    UiColorDefinition TextColor,
    UiColorDefinition RankArrowColor,
    UiColorDefinition GradientColor,
    double GradientOpacity,
    UiColorDefinition EffectColor,
    double EffectOpacity,
    double PrismOpacity,
    double WorldTreeEffectOpacity,
    string EvidenceKind);

internal sealed record WorldTreeUiLayerDefinition(
    string Id,
    string WidgetName,
    string MaterialAssetPath,
    UiColorDefinition Color,
    double BrushTintAlpha,
    IReadOnlyList<string> TextureKeys);

internal sealed record WorldTreeUiEffectDefinition(
    string WidgetName,
    double Opacity,
    IReadOnlyList<WorldTreeUiLayerDefinition> Layers,
    string EvidenceKind);

internal sealed record GameUiAssets(
    string PassiveWidgetSourceAssetPath,
    IReadOnlyDictionary<string, GeneratedImageAsset> PassiveSkillTextures,
    IReadOnlyList<PassiveUiStyleDefinition> PassiveSkillStyles,
    WorldTreeUiEffectDefinition WorldTreeEffect,
    IReadOnlyList<PassiveUiExample> PassiveSkillExamples,
    IReadOnlyList<string> SourceAssets);

internal sealed record PassiveUiExample(
    string StyleId,
    string GameId,
    string NameKo,
    string DescriptionKo,
    int? Rank,
    IReadOnlyList<SourceReference> Sources);
