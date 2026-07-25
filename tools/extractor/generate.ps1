[CmdletBinding()]
param(
    [string]$GameRoot = 'C:\Program Files (x86)\Steam\steamapps\common\Palworld',
    [Parameter(Mandatory)]
    [string]$MappingPath
)

$ErrorActionPreference = 'Stop'

$projectRoot = (Resolve-Path -LiteralPath (
    Join-Path $PSScriptRoot '..\..'
)).Path
$pakDirectory = Join-Path $GameRoot 'Pal\Content\Paks'
$projectFile = Join-Path $PSScriptRoot 'PalAuto.Extractor.csproj'
$localDotnet = Join-Path $projectRoot '.cache\dotnet\dotnet.exe'

if (-not (Test-Path -LiteralPath $pakDirectory -PathType Container)) {
    throw "Palworld pak directory does not exist: $pakDirectory"
}

$resolvedMapping = (Resolve-Path -LiteralPath $MappingPath).Path
$dotnet = if (Test-Path -LiteralPath $localDotnet -PathType Leaf) {
    $localDotnet
} else {
    (Get-Command dotnet -ErrorAction Stop).Source
}

$runArguments = @(
    'run',
    '--project',
    $projectFile
)

if (Test-Path -LiteralPath (
        Join-Path $PSScriptRoot 'obj\project.assets.json'
    ) -PathType Leaf) {
    $runArguments += '--no-restore'
}

$runArguments += @(
    '--',
    'generate',
    $pakDirectory,
    $resolvedMapping,
    $projectRoot
)

& $dotnet @runArguments

exit $LASTEXITCODE
