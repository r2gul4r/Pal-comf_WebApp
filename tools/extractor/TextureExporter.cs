using CUE4Parse.FileProvider;
using CUE4Parse.UE4.Assets.Exports.Texture;
using CUE4Parse_Conversion.Textures;
using SkiaSharp;

namespace PalAuto.Extractor;

internal readonly record struct TextureExportResult(int Width, int Height);

internal static class TextureExporter
{
    public static TextureExportResult WritePng(
        DefaultFileProvider provider,
        string assetPath,
        string outputPath)
    {
        return Write(
            provider,
            assetPath,
            outputPath,
            SKEncodedImageFormat.Png,
            100);
    }

    public static TextureExportResult WriteWebp(
        DefaultFileProvider provider,
        string assetPath,
        string outputPath,
        int? maxDimension = null)
    {
        return Write(
            provider,
            assetPath,
            outputPath,
            SKEncodedImageFormat.Webp,
            92,
            maxDimension);
    }

    private static TextureExportResult Write(
        DefaultFileProvider provider,
        string assetPath,
        string outputPath,
        SKEncodedImageFormat format,
        int quality,
        int? maxDimension = null)
    {
        if (maxDimension is <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(maxDimension),
                maxDimension,
                "Maximum texture dimension must be positive.");
        }

        var package = provider.LoadPackage(assetPath);
        var texture = package.GetExports().OfType<UTexture2D>().Single();
        var decodedTexture = texture.Decode()
            ?? throw new InvalidOperationException(
                $"Texture has no decodable mip data: {assetPath}");
        using var bitmap = decodedTexture.ToSkBitmap();
        using var resizedBitmap = ResizeToFit(bitmap, maxDimension);
        var outputBitmap = resizedBitmap ?? bitmap;
        using var image = SKImage.FromBitmap(outputBitmap);
        using var data = image.Encode(format, quality)
            ?? throw new InvalidOperationException(
                $"Texture encoding failed: {assetPath}");

        var outputDirectory = Path.GetDirectoryName(outputPath)
            ?? throw new InvalidOperationException(
                "Texture output path has no parent directory.");
        Directory.CreateDirectory(outputDirectory);

        using var output = new FileStream(
            outputPath,
            FileMode.Create,
            FileAccess.Write,
            FileShare.None);
        data.SaveTo(output);

        return new TextureExportResult(
            outputBitmap.Width,
            outputBitmap.Height);
    }

    private static SKBitmap? ResizeToFit(
        SKBitmap bitmap,
        int? maxDimension)
    {
        if (maxDimension is null
            || (bitmap.Width <= maxDimension
                && bitmap.Height <= maxDimension))
        {
            return null;
        }

        var scale = Math.Min(
            (double)maxDimension.Value / bitmap.Width,
            (double)maxDimension.Value / bitmap.Height);
        var width = Math.Max(
            1,
            (int)Math.Round(
                bitmap.Width * scale,
                MidpointRounding.AwayFromZero));
        var height = Math.Max(
            1,
            (int)Math.Round(
                bitmap.Height * scale,
                MidpointRounding.AwayFromZero));
        var resized = bitmap.Resize(
            new SKImageInfo(width, height),
            SKFilterQuality.High);
        return resized
            ?? throw new InvalidOperationException(
                $"Texture resizing failed: {bitmap.Width}x{bitmap.Height} " +
                $"to {width}x{height}.");
    }
}
