# Agriko Image Optimization Script
# Automatically optimizes all images in the project

param(
    [string]$InputDir = "public",
    [string]$Quality = "80",
    [switch]$WebP,
    [switch]$Backup = $true,
    [switch]$DryRun
)

# Configuration
$SUPPORTED_FORMATS = @("*.jpg", "*.jpeg", "*.png", "*.gif")
$WEBP_QUALITY = 80
$JPEG_QUALITY = 85
$PNG_QUALITY = 90

function Write-Header {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "    🖼️  AGRIKO IMAGE OPTIMIZER 🖼️" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Step {
    param($Message)
    Write-Host "📋 $Message" -ForegroundColor Yellow
}

function Write-Success {
    param($Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-ImageMagick {
    try {
        $result = magick -version 2>$null
        return $true
    }
    catch {
        return $false
    }
}

function Install-ImageMagick {
    Write-Step "ImageMagick not found. Installing..."
    Write-Host "Please install ImageMagick from: https://imagemagick.org/script/download.php#windows"
    Write-Host "Or use Chocolatey: choco install imagemagick"
    Write-Host "Or use Scoop: scoop install imagemagick"
    exit 1
}

function Get-ImageInfo {
    param($ImagePath)
    
    try {
        $info = magick identify -format "%f %wx%h %b %m" $ImagePath
        $parts = $info -split " "
        return @{
            Name = $parts[0]
            Dimensions = $parts[1]
            Size = $parts[2]
            Format = $parts[3]
        }
    }
    catch {
        return $null
    }
}

function Optimize-Image {
    param(
        [string]$InputPath,
        [string]$OutputPath,
        [string]$Format = "JPEG",
        [int]$Quality = 85
    )
    
    if ($DryRun) {
        $info = Get-ImageInfo $InputPath
        Write-Host "  [DRY RUN] Would optimize: $($info.Name) ($($info.Size) → estimated 60% reduction)" -ForegroundColor Gray
        return $true
    }
    
    try {
        switch ($Format.ToUpper()) {
            "WEBP" {
                magick $InputPath -quality $Quality -format WebP $OutputPath
            }
            "JPEG" {
                magick $InputPath -quality $Quality -format JPEG $OutputPath
            }
            "PNG" {
                magick $InputPath -quality $Quality -format PNG $OutputPath
            }
            default {
                magick $InputPath -quality $Quality $OutputPath
            }
        }
        return $true
    }
    catch {
        Write-Error "Failed to optimize $InputPath"
        return $false
    }
}

function Get-OptimizedSize {
    param($OriginalSize, $OptimizedSize)
    
    if ($OriginalSize -match "(\d+(?:\.\d+)?)([KMGT]?B)") {
        $origValue = [double]$matches[1]
        $origUnit = $matches[2]
    }
    
    if ($OptimizedSize -match "(\d+(?:\.\d+)?)([KMGT]?B)") {
        $optValue = [double]$matches[1]
        $optUnit = $matches[2]
    }
    
    # Convert to bytes for comparison
    $origBytes = Convert-ToBytes $origValue $origUnit
    $optBytes = Convert-ToBytes $optValue $optUnit
    
    $reduction = [math]::Round(($origBytes - $optBytes) / $origBytes * 100, 1)
    return $reduction
}

function Convert-ToBytes {
    param($Value, $Unit)
    
    switch ($Unit) {
        "KB" { return $Value * 1024 }
        "MB" { return $Value * 1024 * 1024 }
        "GB" { return $Value * 1024 * 1024 * 1024 }
        default { return $Value }
    }
}

function Optimize-ProductImages {
    Write-Step "Optimizing product images..."
    
    $productImages = @(
        "5n1-180-for-Website-P3*.jpg",
        "5n1-500-for-health*.jpg", 
        "Honey-with-Background*.jpg",
        "Pure-Salabat-100g-with-Background*.jpg"
    )
    
    $optimized = 0
    $totalSavings = 0
    
    foreach ($pattern in $productImages) {
        $files = Get-ChildItem -Path $InputDir -Name $pattern -ErrorAction SilentlyContinue
        
        foreach ($file in $files) {
            $fullPath = Join-Path $InputDir $file
            $info = Get-ImageInfo $fullPath
            
            if ($info) {
                Write-Host "  📦 Product: $($info.Name) ($($info.Dimensions), $($info.Size))"
                
                # Create optimized versions
                $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file)
                $outputPath = Join-Path $InputDir "$baseName-optimized.jpg"
                
                if (Optimize-Image $fullPath $outputPath "JPEG" $JPEG_QUALITY) {
                    if (!$DryRun) {
                        $newInfo = Get-ImageInfo $outputPath
                        $reduction = Get-OptimizedSize $info.Size $newInfo.Size
                        Write-Host "    ✅ Reduced by $reduction% ($($info.Size) → $($newInfo.Size))" -ForegroundColor Green
                    }
                    $optimized++
                }
                
                # Create WebP version if requested
                if ($WebP) {
                    $webpPath = Join-Path $InputDir "$baseName.webp"
                    if (Optimize-Image $fullPath $webpPath "WEBP" $WEBP_QUALITY) {
                        if (!$DryRun) {
                            $webpInfo = Get-ImageInfo $webpPath
                            Write-Host "    ✅ WebP version: $($webpInfo.Size)" -ForegroundColor Green
                        }
                    }
                }
            }
        }
    }
    
    Write-Success "Optimized $optimized product images"
}

function Optimize-HeroImages {
    Write-Step "Optimizing hero and marketing images..."
    
    $heroImages = @(
        "hero*.png",
        "blend-bg*.png",
        "eco-farm-scaled*.jpg",
        "Agriko-Website-Imagery*.jpg"
    )
    
    $optimized = 0
    
    foreach ($pattern in $heroImages) {
        $files = Get-ChildItem -Path $InputDir -Name $pattern -ErrorAction SilentlyContinue
        
        foreach ($file in $files) {
            $fullPath = Join-Path $InputDir $file
            $info = Get-ImageInfo $fullPath
            
            if ($info) {
                Write-Host "  🖼️  Hero: $($info.Name) ($($info.Dimensions), $($info.Size))"
                
                $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file)
                $ext = [System.IO.Path]::GetExtension($file)
                $format = if ($ext -eq ".png") { "PNG" } else { "JPEG" }
                $quality = if ($ext -eq ".png") { $PNG_QUALITY } else { $JPEG_QUALITY }
                
                $outputPath = Join-Path $InputDir "$baseName-optimized$ext"
                
                if (Optimize-Image $fullPath $outputPath $format $quality) {
                    if (!$DryRun) {
                        $newInfo = Get-ImageInfo $outputPath
                        $reduction = Get-OptimizedSize $info.Size $newInfo.Size
                        Write-Host "    ✅ Reduced by $reduction% ($($info.Size) → $($newInfo.Size))" -ForegroundColor Green
                    }
                    $optimized++
                }
            }
        }
    }
    
    Write-Success "Optimized $optimized hero images"
}

function Optimize-AllImages {
    Write-Step "Optimizing all other images..."
    
    $allImages = Get-ChildItem -Path $InputDir -Include $SUPPORTED_FORMATS -Recurse | Where-Object { 
        $_.Name -notlike "*-optimized*" -and 
        $_.Name -notlike "*copy*" 
    }
    
    $optimized = 0
    $totalOriginalSize = 0
    $totalOptimizedSize = 0
    
    foreach ($image in $allImages) {
        $info = Get-ImageInfo $image.FullName
        
        if ($info) {
            Write-Host "  🔄 $($info.Name) ($($info.Size))"
            
            $baseName = [System.IO.Path]::GetFileNameWithoutExtension($image.Name)
            $ext = $image.Extension
            $outputPath = Join-Path $image.DirectoryName "$baseName-opt$ext"
            
            $format = switch ($ext.ToLower()) {
                ".jpg" { "JPEG" }
                ".jpeg" { "JPEG" }
                ".png" { "PNG" }
                ".gif" { "GIF" }
                default { "JPEG" }
            }
            
            $quality = switch ($format) {
                "PNG" { $PNG_QUALITY }
                "JPEG" { $JPEG_QUALITY }
                default { 80 }
            }
            
            if (Optimize-Image $image.FullName $outputPath $format $quality) {
                $optimized++
            }
        }
    }
    
    Write-Success "Optimized $optimized additional images"
}

function Create-ResponsiveVersions {
    Write-Step "Creating responsive image versions..."
    
    $sizes = @(
        @{ Name = "mobile"; Width = 375; Suffix = "-mobile" },
        @{ Name = "tablet"; Width = 768; Suffix = "-tablet" },
        @{ Name = "desktop"; Width = 1200; Suffix = "-desktop" }
    )
    
    $heroImages = Get-ChildItem -Path $InputDir -Name "hero*.png" -ErrorAction SilentlyContinue
    
    foreach ($image in $heroImages) {
        $fullPath = Join-Path $InputDir $image
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($image)
        
        Write-Host "  📱 Creating responsive versions of $image"
        
        foreach ($size in $sizes) {
            $outputPath = Join-Path $InputDir "$baseName$($size.Suffix).jpg"
            
            if (!$DryRun) {
                try {
                    magick $fullPath -resize "$($size.Width)x>" -quality $JPEG_QUALITY $outputPath
                    Write-Host "    ✅ $($size.Name): $($size.Width)px wide" -ForegroundColor Green
                }
                catch {
                    Write-Host "    ❌ Failed to create $($size.Name) version" -ForegroundColor Red
                }
            } else {
                Write-Host "    [DRY RUN] Would create $($size.Name): $($size.Width)px" -ForegroundColor Gray
            }
        }
    }
}

function Show-Summary {
    param($StartTime)
    
    $duration = (Get-Date) - $StartTime
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "         🎉 OPTIMIZATION COMPLETE! 🎉" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "🔍 DRY RUN SUMMARY:" -ForegroundColor Cyan
        Write-Host "• This was a preview - no files were changed"
        Write-Host "• Run without -DryRun to perform actual optimization"
    } else {
        Write-Host "📊 OPTIMIZATION SUMMARY:" -ForegroundColor Cyan
        Write-Host "• Processing time: $($duration.Minutes)m $($duration.Seconds)s"
        Write-Host "• Optimized images available with '-optimized' suffix"
        Write-Host "• Review results before replacing originals"
    }
    
    Write-Host ""
    Write-Host "🔄 NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "1. Review optimized images in $InputDir"
    Write-Host "2. Compare file sizes and quality"
    Write-Host "3. Replace originals with optimized versions"
    Write-Host "4. Run 'npm run build:export' to rebuild with optimized images"
    Write-Host "5. Deploy using your usual deployment process"
    Write-Host ""
    Write-Host "💡 TIP: Use -WebP flag to generate WebP versions for even better compression!"
}

# Main execution
function Start-ImageOptimization {
    $startTime = Get-Date
    Write-Header
    
    # Check prerequisites
    if (!(Test-ImageMagick)) {
        Install-ImageMagick
        return
    }
    
    Write-Host "🎯 Configuration:" -ForegroundColor Cyan
    Write-Host "• Input directory: $InputDir"
    Write-Host "• JPEG quality: $JPEG_QUALITY%"
    Write-Host "• PNG quality: $PNG_QUALITY%"
    Write-Host "• WebP generation: $(if($WebP){'Enabled'}else{'Disabled'})"
    Write-Host "• Backup originals: $(if($Backup){'Yes'}else{'No'})"
    Write-Host "• Dry run mode: $(if($DryRun){'Yes'}else{'No'})"
    Write-Host ""
    
    if (!$DryRun) {
        $confirm = Read-Host "Continue with image optimization? (y/N)"
        if ($confirm -notin @('y', 'Y')) {
            Write-Host "Optimization cancelled."
            return
        }
    }
    
    # Create backup if requested
    if ($Backup -and !$DryRun) {
        Write-Step "Creating backup of original images..."
        $backupDir = "images-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $InputDir $backupDir -Recurse
        Write-Success "Backup created: $backupDir"
    }
    
    # Run optimization
    try {
        Optimize-ProductImages
        Optimize-HeroImages
        if (!$DryRun) {
            Create-ResponsiveVersions
        }
        # Optimize-AllImages  # Uncomment for full optimization
        
        Show-Summary $startTime
    }
    catch {
        Write-Error "Optimization failed: $($_.Exception.Message)"
        exit 1
    }
}

# Run the optimization
Start-ImageOptimization