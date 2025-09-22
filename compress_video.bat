@echo off
echo ========================================
echo    COMPRESSION VIDEO AF BOXING CLUB
echo ========================================
echo.

REM Vérifier si FFmpeg est installé
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo ERREUR: FFmpeg n'est pas installe.
    echo.
    echo Veuillez installer FFmpeg depuis: https://ffmpeg.org/download.html
    echo Ou utilisez une alternative en ligne.
    pause
    exit /b 1
)

REM Créer un dossier pour les vidéos optimisées
if not exist "src/assets/optimized" mkdir "src/assets/optimized"

echo Taille originale de la video:
dir "src/assets/club.mp4" | find "club.mp4"
echo.

echo Compression en cours...
echo.

REM Version web optimisée (qualité réduite, taille réduite)
echo [1/4] Creation de la version web (1280x720)...
ffmpeg -i "src/assets/club.mp4" -c:v libx264 -crf 28 -preset fast -c:a aac -b:a 128k -movflags +faststart -vf "scale=1280:720" "src/assets/optimized/club_web.mp4" -y

REM Version mobile (encore plus petite)
echo [2/4] Creation de la version mobile (854x480)...
ffmpeg -i "src/assets/club.mp4" -c:v libx264 -crf 32 -preset fast -c:a aac -b:a 96k -movflags +faststart -vf "scale=854:480" "src/assets/optimized/club_mobile.mp4" -y

REM Version ultra légère pour connexions lentes
echo [3/4] Creation de la version ultra legere (640x360)...
ffmpeg -i "src/assets/club.mp4" -c:v libx264 -crf 35 -preset fast -c:a aac -b:a 64k -movflags +faststart -vf "scale=640:360" "src/assets/optimized/club_light.mp4" -y

REM Version poster image (première frame)
echo [4/4] Creation de l'image poster...
ffmpeg -i "src/assets/club.mp4" -ss 00:00:01 -vframes 1 -q:v 2 "src/assets/optimized/club_poster.jpg" -y

echo.
echo ========================================
echo    COMPRESSION TERMINEE !
echo ========================================
echo.
echo Fichiers crees dans src/assets/optimized/:
echo.
echo Taille des fichiers:
dir "src/assets/optimized" /b
echo.
echo.
echo RECOMMANDATIONS:
echo - Utilisez club_web.mp4 pour desktop
echo - Utilisez club_mobile.mp4 pour mobile
echo - Utilisez club_light.mp4 pour connexions lentes
echo - Utilisez club_poster.jpg comme image de fallback
echo.
echo Pour appliquer les changements:
echo 1. Remplacez src/assets/club.mp4 par club_web.mp4
echo 2. Mettez a jour le code pour utiliser les bonnes versions
echo.
pause
