const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../node_modules/@capacitor/splash-screen/android/src/main/java/com/capacitorjs/plugins/splashscreen/SplashScreen.java');

if (fs.existsSync(targetFile)) {
    let content = fs.readFileSync(targetFile, 'utf8');
    
    // Check if already patched
    if (!content.includes('private boolean timerStarted')) {
        // Fix Android 12 Splash API premature dismissal bug
        content = content.replace(
            'private boolean isVisible = false;', 
            'private boolean isVisible = true;\n    private boolean timerStarted = false; // [PATCHED]'
        );
        content = content.replace(
            'if (!isVisible && !isHiding) {',
            'if (!timerStarted && !isHiding) { timerStarted = true;'
        );
        
        fs.writeFileSync(targetFile, content);
        console.log('Successfully patched Capacitor SplashScreen to prevent blank screen bug.');
    } else {
        console.log('Capacitor SplashScreen already patched.');
    }
}
