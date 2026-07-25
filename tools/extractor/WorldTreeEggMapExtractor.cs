using System.Globalization;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets.Exports.Engine;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace PalAuto.Extractor;

internal static partial class WorldTreeEggMapExtractor
{
    private const string WorldMapDataPath =
        "Pal/Content/Pal/DataTable/WorldMapUIData/DT_WorldMapUIData";
    private const string WorldMapRowId = "Tree";
    private const string EggItemNamePath =
        "Pal/Content/L10N/ko/Pal/DataTable/Text/DT_ItemNameText_Common";
    private const string EggItemId = "PalEgg_WorldTree_01";
    private const string EggItemNameRowId =
        "ITEM_NAME_PalEgg_WorldTree_01";
    private const string EggIconPath =
        "Pal/Content/Others/InventoryItemIcon/Texture/" +
        "T_itemicon_Material_PalEgg_WorldTree_01";
    private const string SpawnerBlueprintPath =
        "Pal/Content/Pal/Blueprint/MapObject/Spawner/" +
        "bp_palmapobjectspawner_palegg_worldtree_grade_01";
    private const string SpawnerDefaultExportName =
        "Default__bp_palmapobjectspawner_palegg_worldtree_grade_01_C";
    private const string SpawnerTypeName =
        "bp_palmapobjectspawner_palegg_worldtree_grade_01_C";
    private const string MapCoordinateWidgetPath =
        "Pal/Content/Pal/Blueprint/UI/UserInterface/Map/WBP_Map_Base";
    private const string GeneratedMapPrefix =
        "Pal/Content/Pal/Maps/MainWorld_5/PL_MainWorld5/_Generated_/";
    private const double WorldPartitionCellSize = 25_600.0;
    private const int ExpectedSpawnerCount = 30;

    // WBP_Map_Base.PrintPosition의 MapRangeUnclamped 리터럴.
    // 현재 설치본에서 역직렬화해 확인한 값이며 빌드 메타정보와 함께 보존함.
    private const double DisplayWorldXMin = -582_888.0;
    private const double DisplayWorldXMax = 335_112.0;
    private const double DisplayWorldYMin = -301_000.0;
    private const double DisplayWorldYMax = 617_000.0;
    private const double DisplayCoordinateMin = -1_000.0;
    private const double DisplayCoordinateMax = 1_000.0;

    [GeneratedRegex(
        @"MainGrid_L0_X(?<x>-?\d+)_Y(?<y>-?\d+)_DL[^/]+\.umap$",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex GeneratedMapPackageRegex();

    [GeneratedRegex(
        @"\.(?<index>\d+)$",
        RegexOptions.CultureInvariant)]
    private static partial Regex ExportIndexRegex();

    [GeneratedRegex(
        @"grade_(?<index>\d+)$",
        RegexOptions.CultureInvariant | RegexOptions.IgnoreCase)]
    private static partial Regex SpawnerIndexRegex();

    public static WorldTreeEggMapDataset Extract(
        DefaultFileProvider provider,
        string projectRoot)
    {
        var mapRow = LoadTableRow(
            provider,
            WorldMapDataPath,
            WorldMapRowId);
        var worldBounds = new WorldTreeMapBounds(
            ReadVector(
                mapRow["landScapeRealPositionMin"],
                "Tree landscape minimum"),
            ReadVector(
                mapRow["landScapeRealPositionMax"],
                "Tree landscape maximum"));
        ValidateWorldBounds(worldBounds);

        var mapTextureObjectPath =
            mapRow.SelectToken(
                    "textureDataMap[0].Value.Texture.AssetPathName")
                ?.Value<string>()
            ?? throw new InvalidDataException(
                "Tree world-map texture reference is missing.");
        var mapTexturePath =
            ConvertObjectPathToPackagePath(mapTextureObjectPath);
        var mapImage = ExportMapImage(
            provider,
            projectRoot,
            mapTexturePath);
        var markerIcon = ExportMarkerIcon(
            provider,
            projectRoot);

        var itemNameRow = LoadTableRow(
            provider,
            EggItemNamePath,
            EggItemNameRowId);
        var itemNameKo =
            itemNameRow.SelectToken("TextData.LocalizedString")
                ?.Value<string>()
            ?? itemNameRow.SelectToken("TextData.SourceString")
                ?.Value<string>()
            ?? throw new InvalidDataException(
                $"Localized item name is missing: {EggItemNameRowId}");

        var spawnerRules = ReadSpawnerRules(
            provider,
            itemNameKo);
        var points = ReadSpawnPoints(
            provider,
            worldBounds);
        ValidateSpawnPoints(points);

        var sourceAssets = new[]
            {
                WorldMapDataPath,
                mapTexturePath,
                EggItemNamePath,
                EggIconPath,
                SpawnerBlueprintPath,
                MapCoordinateWidgetPath,
            }
            .Concat(points.Select(point => point.SourcePackage))
            .Distinct(StringComparer.Ordinal)
            .OrderBy(path => path, StringComparer.Ordinal)
            .ToArray();

        return new WorldTreeEggMapDataset(
            "1.0.0",
            WorldMapRowId,
            "세계수",
            mapImage,
            markerIcon,
            worldBounds,
            new WorldTreeDisplayCoordinateDefinition(
                new WorldTreeAxisRange(
                    DisplayWorldYMin,
                    DisplayWorldYMax,
                    DisplayCoordinateMin,
                    DisplayCoordinateMax),
                new WorldTreeAxisRange(
                    DisplayWorldXMin,
                    DisplayWorldXMax,
                    DisplayCoordinateMin,
                    DisplayCoordinateMax),
                MapCoordinateWidgetPath,
                "verified_installed_widget_bytecode"),
            spawnerRules,
            points,
            sourceAssets);
    }

    private static GeneratedImageAsset ExportMapImage(
        DefaultFileProvider provider,
        string projectRoot,
        string assetPath)
    {
        const string webPath =
            "/generated/ui/maps/world-tree.webp";
        var outputPath = ToOutputPath(projectRoot, webPath);
        var result = TextureExporter.WriteWebp(
            provider,
            assetPath,
            outputPath,
            4096);
        return BuildImageAsset(
            outputPath,
            webPath,
            result,
            assetPath);
    }

    private static GeneratedImageAsset ExportMarkerIcon(
        DefaultFileProvider provider,
        string projectRoot)
    {
        const string webPath =
            "/generated/ui/maps/ominous-egg.png";
        var outputPath = ToOutputPath(projectRoot, webPath);
        var result = TextureExporter.WritePng(
            provider,
            EggIconPath,
            outputPath);
        return BuildImageAsset(
            outputPath,
            webPath,
            result,
            EggIconPath);
    }

    private static string ToOutputPath(
        string projectRoot,
        string webPath)
    {
        return Path.Combine(
            projectRoot,
            "public",
            webPath.TrimStart('/')
                .Replace('/', Path.DirectorySeparatorChar));
    }

    private static GeneratedImageAsset BuildImageAsset(
        string outputPath,
        string webPath,
        TextureExportResult result,
        string sourceAssetPath)
    {
        var sha256 = Convert.ToHexString(
                SHA256.HashData(File.ReadAllBytes(outputPath)))
            .ToLowerInvariant();
        return new GeneratedImageAsset(
            webPath,
            result.Width,
            result.Height,
            sha256,
            sourceAssetPath);
    }

    private static WorldTreeEggSpawnerRules ReadSpawnerRules(
        DefaultFileProvider provider,
        string itemNameKo)
    {
        var package = provider.LoadPackage(SpawnerBlueprintPath);
        var export = package.GetExports()
            .Select(
                value => JObject.Parse(
                    JsonConvert.SerializeObject(value)))
            .SingleOrDefault(
                value => value.Value<string>("Name")
                    == SpawnerDefaultExportName)
            ?? throw new InvalidDataException(
                $"Spawner default export is missing: " +
                SpawnerDefaultExportName);
        var properties = export["Properties"] as JObject
            ?? throw new InvalidDataException(
                "World-tree egg spawner properties are missing.");
        if (properties.Value<bool?>("bIsWorldTreePalEgg") is not true)
        {
            throw new InvalidDataException(
                "Spawner is not marked as a world-tree Pal egg.");
        }

        var probability =
            properties.Value<int?>("WorldTreePalEggProbability")
            ?? throw new InvalidDataException(
                "World-tree egg probability is missing.");
        var respawnMinutes =
            properties.Value<double?>("RespawnTimeMinutesObtained")
            ?? throw new InvalidDataException(
                "World-tree egg respawn time is missing.");
        var lotteryCooldownMinutes =
            properties.Value<double?>("LotteryCoolTimeMinutes")
            ?? throw new InvalidDataException(
                "World-tree egg lottery cooldown is missing.");

        return new WorldTreeEggSpawnerRules(
            EggItemId,
            itemNameKo,
            SpawnerTypeName,
            probability,
            respawnMinutes,
            lotteryCooldownMinutes,
            SpawnerBlueprintPath);
    }

    private static IReadOnlyList<WorldTreeEggSpawnPoint> ReadSpawnPoints(
        DefaultFileProvider provider,
        WorldTreeMapBounds worldBounds)
    {
        var minGridX = (int)Math.Floor(
            worldBounds.Min.X / WorldPartitionCellSize);
        var maxGridX = (int)Math.Floor(
            worldBounds.Max.X / WorldPartitionCellSize);
        var minGridY = (int)Math.Floor(
            worldBounds.Min.Y / WorldPartitionCellSize);
        var maxGridY = (int)Math.Floor(
            worldBounds.Max.Y / WorldPartitionCellSize);

        var candidatePackages = provider.Files.Keys
            .Where(
                path => path.StartsWith(
                    GeneratedMapPrefix,
                    StringComparison.OrdinalIgnoreCase))
            .Select(
                path => new
                {
                    Path = path,
                    Match = GeneratedMapPackageRegex().Match(path),
                })
            .Where(candidate => candidate.Match.Success)
            .Where(
                candidate =>
                {
                    var x = int.Parse(
                        candidate.Match.Groups["x"].Value,
                        CultureInfo.InvariantCulture);
                    var y = int.Parse(
                        candidate.Match.Groups["y"].Value,
                        CultureInfo.InvariantCulture);
                    return x >= minGridX
                           && x <= maxGridX
                           && y >= minGridY
                           && y <= maxGridY;
                })
            .Select(candidate => candidate.Path)
            .OrderBy(path => path, StringComparer.Ordinal)
            .ToArray();

        if (candidatePackages.Length == 0)
        {
            throw new InvalidDataException(
                "No generated World Tree map packages matched the " +
                "landscape bounds.");
        }

        var points = new List<WorldTreeEggSpawnPoint>();
        foreach (var packageFilePath in candidatePackages)
        {
            var packagePath = packageFilePath.EndsWith(
                    ".umap",
                    StringComparison.OrdinalIgnoreCase)
                ? packageFilePath[..^5]
                : packageFilePath;
            var package = provider.LoadPackage(packagePath);
            var exports = package.GetExports().ToArray();

            foreach (var actor in exports.Where(
                         export => export.GetType().Name == "AActor"))
            {
                var actorJson = JObject.Parse(
                    JsonConvert.SerializeObject(actor));
                if (!string.Equals(
                        actorJson.Value<string>("Type"),
                        SpawnerTypeName,
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var actorLabel = actorJson.Value<string>("ActorLabel")
                    ?? throw new InvalidDataException(
                        $"World-tree egg actor has no label: {packagePath}");
                var indexMatch = SpawnerIndexRegex().Match(actorLabel);
                if (!indexMatch.Success)
                {
                    throw new InvalidDataException(
                        $"World-tree egg actor label has no numeric index: " +
                        actorLabel);
                }

                var rootObjectPath =
                    actorJson.SelectToken(
                            "Properties.RootComponent.ObjectPath")
                        ?.Value<string>()
                    ?? throw new InvalidDataException(
                        $"World-tree egg actor has no root component: " +
                        actorLabel);
                var rootMatch = ExportIndexRegex().Match(rootObjectPath);
                if (!rootMatch.Success
                    || !int.TryParse(
                        rootMatch.Groups["index"].Value,
                        out var rootIndex)
                    || rootIndex < 0
                    || rootIndex >= exports.Length)
                {
                    throw new InvalidDataException(
                        $"World-tree egg root export index is invalid: " +
                        rootObjectPath);
                }

                var rootJson = JObject.Parse(
                    JsonConvert.SerializeObject(exports[rootIndex]));
                var worldPosition = ReadVector(
                    rootJson.SelectToken("Properties.RelativeLocation"),
                    $"{actorLabel} world position");
                var displayCoordinate = ToDisplayCoordinate(worldPosition);
                var mapPosition = ToMapPosition(
                    worldPosition,
                    worldBounds);
                var index = int.Parse(
                    indexMatch.Groups["index"].Value,
                    CultureInfo.InvariantCulture);

                points.Add(
                    new WorldTreeEggSpawnPoint(
                        $"world-tree-egg-{index:00}",
                        index,
                        actorLabel,
                        worldPosition,
                        displayCoordinate,
                        mapPosition,
                        packagePath));
            }
        }

        return points
            .OrderBy(point => point.Index)
            .ToArray();
    }

    private static WorldTreeGameCoordinate ToDisplayCoordinate(
        WorldTreeVector worldPosition)
    {
        var x = MapRangeUnclamped(
            worldPosition.Y,
            DisplayWorldYMin,
            DisplayWorldYMax,
            DisplayCoordinateMin,
            DisplayCoordinateMax);
        var y = MapRangeUnclamped(
            worldPosition.X,
            DisplayWorldXMin,
            DisplayWorldXMax,
            DisplayCoordinateMin,
            DisplayCoordinateMax);
        return new WorldTreeGameCoordinate(
            (int)Math.Round(x, MidpointRounding.ToEven),
            (int)Math.Round(y, MidpointRounding.ToEven));
    }

    private static double MapRangeUnclamped(
        double value,
        double inputMin,
        double inputMax,
        double outputMin,
        double outputMax)
    {
        return outputMin
               + ((value - inputMin) / (inputMax - inputMin))
               * (outputMax - outputMin);
    }

    private static WorldTreeMapPosition ToMapPosition(
        WorldTreeVector worldPosition,
        WorldTreeMapBounds bounds)
    {
        var left = (worldPosition.Y - bounds.Min.Y)
                   / (bounds.Max.Y - bounds.Min.Y);
        var top = 1.0
                  - ((worldPosition.X - bounds.Min.X)
                     / (bounds.Max.X - bounds.Min.X));
        return new WorldTreeMapPosition(left, top);
    }

    private static JObject LoadTableRow(
        DefaultFileProvider provider,
        string assetPath,
        string rowId)
    {
        var package = provider.LoadPackage(assetPath);
        var table = package.GetExports().OfType<UDataTable>().Single();
        var row = table.RowMap.SingleOrDefault(
            value => value.Key.Text == rowId);
        if (row.Value is null)
        {
            throw new InvalidDataException(
                $"Required row {rowId} is missing from {assetPath}.");
        }

        return JObject.Parse(
            JsonConvert.SerializeObject(row.Value));
    }

    private static WorldTreeVector ReadVector(
        JToken? token,
        string label)
    {
        var value = token as JObject
            ?? throw new InvalidDataException(
                $"{label} is not an object.");
        return new WorldTreeVector(
            value.Value<double?>("X")
                ?? throw new InvalidDataException($"{label} has no X."),
            value.Value<double?>("Y")
                ?? throw new InvalidDataException($"{label} has no Y."),
            value.Value<double?>("Z")
                ?? throw new InvalidDataException($"{label} has no Z."));
    }

    private static string ConvertObjectPathToPackagePath(
        string objectPath)
    {
        var separatorIndex = objectPath.LastIndexOf('.');
        var packagePath = separatorIndex >= 0
            ? objectPath[..separatorIndex]
            : objectPath;
        const string gamePrefix = "/Game/";
        if (!packagePath.StartsWith(
                gamePrefix,
                StringComparison.Ordinal))
        {
            throw new InvalidDataException(
                $"Unsupported game object path: {objectPath}");
        }

        return "Pal/Content/" + packagePath[gamePrefix.Length..];
    }

    private static void ValidateWorldBounds(
        WorldTreeMapBounds bounds)
    {
        if (bounds.Max.X <= bounds.Min.X
            || bounds.Max.Y <= bounds.Min.Y)
        {
            throw new InvalidDataException(
                "World Tree map bounds are inverted or empty.");
        }
    }

    private static void ValidateSpawnPoints(
        IReadOnlyList<WorldTreeEggSpawnPoint> points)
    {
        if (points.Count != ExpectedSpawnerCount)
        {
            throw new InvalidDataException(
                $"Expected {ExpectedSpawnerCount} world-tree egg spawners " +
                $"but found {points.Count}.");
        }

        var expectedIndices = Enumerable.Range(
            1,
            ExpectedSpawnerCount);
        var actualIndices = points
            .Select(point => point.Index)
            .OrderBy(index => index);
        if (!expectedIndices.SequenceEqual(actualIndices))
        {
            throw new InvalidDataException(
                "World-tree egg spawner indices are not contiguous 1-30.");
        }

        foreach (var point in points)
        {
            if (point.MapPosition.Left is < 0 or > 1
                || point.MapPosition.Top is < 0 or > 1)
            {
                throw new InvalidDataException(
                    $"{point.Id} falls outside the Tree map bounds.");
            }
        }
    }
}

internal sealed record WorldTreeEggMapDataset(
    string SchemaVersion,
    string RegionId,
    string RegionNameKo,
    GeneratedImageAsset MapImage,
    GeneratedImageAsset MarkerIcon,
    WorldTreeMapBounds WorldBounds,
    WorldTreeDisplayCoordinateDefinition DisplayCoordinates,
    WorldTreeEggSpawnerRules Spawner,
    IReadOnlyList<WorldTreeEggSpawnPoint> Points,
    IReadOnlyList<string> SourceAssets);

internal sealed record WorldTreeMapBounds(
    WorldTreeVector Min,
    WorldTreeVector Max);

internal sealed record WorldTreeDisplayCoordinateDefinition(
    WorldTreeAxisRange X,
    WorldTreeAxisRange Y,
    string SourceAssetPath,
    string EvidenceKind);

internal sealed record WorldTreeAxisRange(
    double WorldMin,
    double WorldMax,
    double DisplayMin,
    double DisplayMax);

internal sealed record WorldTreeEggSpawnerRules(
    string ItemId,
    string ItemNameKo,
    string SpawnerType,
    int WorldTreeEggProbability,
    double RespawnMinutesObtained,
    double LotteryCooldownMinutes,
    string SourceAssetPath);

internal sealed record WorldTreeEggSpawnPoint(
    string Id,
    int Index,
    string ActorLabel,
    WorldTreeVector WorldPosition,
    WorldTreeGameCoordinate GameCoordinate,
    WorldTreeMapPosition MapPosition,
    string SourcePackage);

internal sealed record WorldTreeVector(
    double X,
    double Y,
    double Z);

internal sealed record WorldTreeGameCoordinate(
    int X,
    int Y);

internal sealed record WorldTreeMapPosition(
    double Left,
    double Top);
