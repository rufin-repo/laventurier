@echo off
SETLOCAL
rem set _buildNumFile="mma-build.txt"
rem echo Build Number filename: %_buildNumFile%

rem **********************************************************************
rem Step 1:  Merge all js files to be closure compiled into one
rem **********************************************************************
echo [1] Merging all js files into $closure_in$.injs for the closure compiler:
copy laven.js + linebreak.txt  $closure_in$.injs

rem ***********************************************************************
rem Step 2:  create build# file and replace BuildDate: string in js script
rem          Make sure the "createBuildNumFile"
rem ***********************************************************************
rem echo [2] Creating %_buildNumFile% and replacing BuildDate string to get $closure_in$.injs
rem gawk -f BuildPrep.awk -v createBuildNumFile=%_buildNumFile% $noBuildNum$.alljs > $closure_in$.injs


rem ***********************************************************************
rem Step 3:  Closure-compile the prepared all-in-one js file
rem ***********************************************************************
echo [3] Calling the closure compiler to generate lavenweb.clo.js
call closure --compilation_level ADVANCED_OPTIMIZATIONS --js $closure_in$.injs --js_output_file lavenweb.clo.js

if %ERRORLEVEL% EQU 0 (
	echo Closure compiler finished without error.
	echo [4] Inserting lavenweb.clo.js into the html file...

	rem ***********************************************************************
	rem Step 4:  Generate sed script for inserting the compiled js into html
	rem ***********************************************************************
	@rem *** Note: When adding 3rd party script, be sure to update "closure_externs.js" to include the external functions used.
	echo /^^ *^<script src=/ {> $insert$.sed
	echo a\>> $insert$.sed
	echo ^<script^>>> $insert$.sed
	@rem echo r twgl-full.min.js>> $insert$.sed
	@rem echo r decimal.min.js>> $insert$.sed
	echo r lavenweb.clo.js>> $insert$.sed
	echo a\>> $insert$.sed
	echo ^</script^>>> $insert$.sed
	echo d>> $insert$.sed
	echo }>> $insert$.sed

	sed -r -f $insert$.sed laven.html > lavenapp.html
	rem  goto end

  if %ERRORLEVEL% EQU 0 (
    rem del $insert$.sed
    echo Output html file "lavenapp.html" ready.

    echo [8] Calling html-minifier...
    call html-minifier --remove-comments --minify-css true lavenapp.html -o lavenmin.html
    echo [Done] Release ready "lavenmin.html" created.
    echo.
    echo *** Make sure the first file listed in the ...-sw.js file matches the name of the html file!!!
    echo.

  ) else (
    echo sed step failed.
    echo sed script used:
    echo ----------------------------------------
    type $insert$.sed
    echo ----------------------------------------
    del $insert$.sed
    goto end
  )
) else (
echo closure compiler returned with error code: %ERRORLEVEL%
)
:end
