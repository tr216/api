@echo off
title API SYSTEM
set screen=%1
set position=%2
set /a width=1600
set /a height=900

if %screen%==2 set width=1440
if %screen%==2 set height=500

echo w= %width%
echo h= %height%

REM c:\portable_programs\cmdow.exe @ /SIZ 700 400
REM c:\portable_programs\cmdow.exe @ /MOV 1604 10
REM c:\portable_programs\cmdow.exe @ /P
echo program calisiyor
pause
