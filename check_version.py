import zipfile

def get_version_code(aab_path):
    with zipfile.ZipFile(aab_path, 'r') as z:
        manifest_data = z.read('base/manifest/AndroidManifest.xml')
        # Simple extraction of the versionCode from protocol buffer format
        # In the binary XML, versionCode is typically followed by its integer value.
        # Let's search for the string 'versionCode' and read the bytes.
        idx = manifest_data.find(b'versionCode')
        if idx != -1:
            print("Found versionCode string at index:", idx)
            # Let's dump some bytes around it
            dump = manifest_data[idx:idx+100]
            print("Hex dump around versionCode:", dump.hex())
            # In compiled XML, the attribute value is stored in a structured way.
            # Let's extract the integer values from the manifest.
            # A simpler way is to look at the raw bytes after 'versionCode'.
            
aab_path = '/Users/sl307282gmail.com/Desktop/EMI_PRO_SIGNED_CORRECT.aab'
get_version_code(aab_path)
