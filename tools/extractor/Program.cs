using CUE4Parse.FileProvider;
using CUE4Parse.MappingsProvider.Usmap;
using CUE4Parse.UE4.Assets.Exports.Engine;
using CUE4Parse.UE4.Versions;
using Newtonsoft.Json;

namespace PalAuto.Extractor;

internal static class Program
{
    private const string MonsterParameterPath =
        "Pal/Content/Pal/DataTable/Character/DT_PalMonsterParameter";

    public static int Main(string[] args)
    {
        try
        {
            return Run(args);
        }
        catch (Exception exception)
        {
            Console.Error.WriteLine($"Extractor failed: {exception}");
            return 1;
        }
    }

    private static int Run(string[] args)
    {
        if (args is ["probe", var pakDirectory])
        {
            return DumpTable(pakDirectory, null, MonsterParameterPath, null, 5);
        }

        if (args is ["probe", var mappedPakDirectory, var mappingPath])
        {
            return DumpTable(
                mappedPakDirectory,
                mappingPath,
                MonsterParameterPath,
                null,
                5);
        }

        if (args.Length is >= 4 and <= 6 && args[0] == "table")
        {
            var rowFilter = args.Length >= 5 ? args[4] : null;
            var limit = args.Length == 6 ? ParseLimit(args[5]) : 5;
            return DumpTable(args[1], args[2], args[3], rowFilter, limit);
        }

        if (args.Length is >= 4 and <= 6 && args[0] == "package")
        {
            var exportFilter = args.Length >= 5 ? args[4] : null;
            var limit = args.Length == 6 ? ParseLimit(args[5]) : 20;
            return DumpPackage(args[1], args[2], args[3], exportFilter, limit);
        }

        if (args is ["texture", var texturePakDirectory, var textureMappingPath,
            var textureAssetPath, var textureOutputPath])
        {
            return ExportTexture(
                texturePakDirectory,
                textureMappingPath,
                textureAssetPath,
                textureOutputPath);
        }
        if (args is ["sample", var samplePakDirectory, var sampleMappingPath,
            var sampleOutputDirectory])
        {
            return SampleExtractor.Extract(
                samplePakDirectory,
                sampleMappingPath,
                sampleOutputDirectory);
        }

        if (args is ["generate", var datasetPakDirectory,
            var datasetMappingPath, var projectRoot])
        {
            return DatasetExtractor.Extract(
                datasetPakDirectory,
                datasetMappingPath,
                projectRoot);
        }

        Console.Error.WriteLine(
            "Usage:\n" +
            "  PalAuto.Extractor probe <pak-directory> [mapping.usmap]\n" +
            "  PalAuto.Extractor table <pak-directory> <mapping.usmap> " +
            "<asset-path> [row-name-contains] [limit]\n" +
            "  PalAuto.Extractor package <pak-directory> <mapping.usmap> " +
            "<asset-path> [export-name-contains] [limit]\n" +
            "  PalAuto.Extractor texture <pak-directory> <mapping.usmap> " +
            "<asset-path> <output.png>\n" +
            "  PalAuto.Extractor sample <pak-directory> <mapping.usmap> " +
            "<output-directory>\n" +
            "  PalAuto.Extractor generate <pak-directory> <mapping.usmap> " +
            "<project-root>");
        return 2;
    }

    private static int ParseLimit(string value)
    {
        if (!int.TryParse(value, out var limit) || limit is < 1 or > 5000)
        {
            throw new ArgumentOutOfRangeException(
                nameof(value),
                value,
                "Row limit must be an integer between 1 and 5000.");
        }

        return limit;
    }

    private static int DumpTable(
        string pakDirectory,
        string? mappingPath,
        string assetPath,
        string? rowFilter,
        int limit)
    {
        var (provider, mountedArchiveCount) = OpenProvider(pakDirectory, mappingPath);
        using (provider)
        {
            var package = provider.LoadPackage(assetPath);
            var table = package.GetExports().OfType<UDataTable>().Single();
            var matchingRows = table.RowMap.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(rowFilter))
            {
                matchingRows = matchingRows.Where(
                    row => row.Key.Text.Contains(
                        rowFilter,
                        StringComparison.OrdinalIgnoreCase));
            }

            var rows = matchingRows
                .Take(limit)
                .ToDictionary(
                    row => row.Key.Text,
                    row => row.Value,
                    StringComparer.Ordinal);

            Console.WriteLine(
                JsonConvert.SerializeObject(
                    new
                    {
                        EngineVersion = "5.1.1",
                        Mapping = mappingPath ?? "none",
                        MountedArchiveCount = mountedArchiveCount,
                        AssetPath = assetPath,
                        RowCount = table.RowMap.Count,
                        MatchedRowCount = rows.Count,
                        RowFilter = rowFilter,
                        Rows = rows,
                    },
                    Formatting.Indented));
        }

        return 0;
    }

    private static int DumpPackage(
        string pakDirectory,
        string mappingPath,
        string assetPath,
        string? exportFilter,
        int limit)
    {
        var (provider, mountedArchiveCount) = OpenProvider(pakDirectory, mappingPath);
        using (provider)
        {
            var package = provider.LoadPackage(assetPath);
            var allExports = package.GetExports();
            var matchingExports = allExports.AsEnumerable();

            if (!string.IsNullOrWhiteSpace(exportFilter))
            {
                matchingExports = matchingExports.Where(
                    export => export.Name.Contains(
                        exportFilter,
                        StringComparison.OrdinalIgnoreCase));
            }

            var exports = matchingExports
                .Take(limit)
                .Select(
                    export => new
                    {
                        Name = export.Name,
                        RuntimeType = export.GetType().FullName,
                        Data = export,
                    })
                .ToArray();

            Console.WriteLine(
                JsonConvert.SerializeObject(
                    new
                    {
                        EngineVersion = "5.1.1",
                        Mapping = mappingPath,
                        MountedArchiveCount = mountedArchiveCount,
                        AssetPath = assetPath,
                        ExportCount = allExports.Count(),
                        MatchedExportCount = exports.Length,
                        ExportFilter = exportFilter,
                        Exports = exports,
                    },
                    Formatting.Indented));
        }

        return 0;
    }
    private static int ExportTexture(
        string pakDirectory,
        string mappingPath,
        string assetPath,
        string outputPath)
    {
        var absoluteOutputPath =
            ResolveSafeOutputPath(pakDirectory, outputPath);
        var (provider, mountedArchiveCount) = OpenProvider(pakDirectory, mappingPath);
        using (provider)
        {
            var result =
                TextureExporter.WritePng(provider, assetPath, absoluteOutputPath);

            Console.WriteLine(
                JsonConvert.SerializeObject(
                    new
                    {
                        AssetPath = assetPath,
                        OutputPath = absoluteOutputPath,
                        result.Width,
                        result.Height,
                        MountedArchiveCount = mountedArchiveCount,
                    },
                    Formatting.Indented));
        }

        return 0;
    }

    internal static string ResolveSafeOutputPath(
        string pakDirectory,
        string outputPath)
    {
        var absoluteOutputPath = Path.GetFullPath(outputPath);
        var protectedRoot =
            FindAncestorDirectory(pakDirectory, "Palworld")
            ?? Path.GetFullPath(pakDirectory);
        var normalizedRoot = Path.TrimEndingDirectorySeparator(
            Path.GetFullPath(protectedRoot));
        var rootPrefix = normalizedRoot + Path.DirectorySeparatorChar;

        if (absoluteOutputPath.Equals(
                normalizedRoot,
                StringComparison.OrdinalIgnoreCase)
            || absoluteOutputPath.StartsWith(
                rootPrefix,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "Refusing to write extraction output inside the Palworld " +
                $"installation: {absoluteOutputPath}");
        }

        return absoluteOutputPath;
    }

    internal static string? FindAncestorDirectory(
        string path,
        string directoryName)
    {
        for (var directory = new DirectoryInfo(Path.GetFullPath(path));
             directory is not null;
             directory = directory.Parent)
        {
            if (directory.Name.Equals(
                    directoryName,
                    StringComparison.OrdinalIgnoreCase))
            {
                return directory.FullName;
            }
        }

        return null;
    }

    internal static (DefaultFileProvider Provider, int MountedArchiveCount)
        OpenProvider(
        string pakDirectory,
        string? mappingPath)
    {
        if (!Directory.Exists(pakDirectory))
        {
            throw new DirectoryNotFoundException(
                $"Palworld pak directory does not exist: {pakDirectory}");
        }

        var provider = new DefaultFileProvider(
            pakDirectory,
            SearchOption.TopDirectoryOnly,
            new VersionContainer(EGame.GAME_UE5_1),
            StringComparer.OrdinalIgnoreCase);

        try
        {
            if (mappingPath is not null)
            {
                if (!File.Exists(mappingPath))
                {
                    throw new FileNotFoundException(
                        "The supplied mappings file does not exist.",
                        mappingPath);
                }

                provider.MappingsContainer =
                    new FileUsmapTypeMappingsProvider(mappingPath);
            }

            provider.Initialize();
            var mountedArchiveCount = provider.Mount();
            if (mountedArchiveCount == 0)
            {
                throw new InvalidOperationException(
                    "No readable pak archive was mounted.");
            }

            return (provider, mountedArchiveCount);
        }
        catch
        {
            provider.Dispose();
            throw;
        }
    }
}
