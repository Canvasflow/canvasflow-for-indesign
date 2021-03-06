#!/bin/bash
reset
clear
echo "Admin rights required to update the plugin"
echo "Please enter your password 🔓"
echo ""
sudo echo "Initializing plugin update"
if sudo -n true 2>/dev/null; then 
    echo ""
else
    echo ""
    echo "😞 Authentication failed, please try again"
    echo ""
    read -p "Press Enter to close"
    clear
    exit 1
fi

cd "/Applications"
IFS_backup=$IFS
IFS=$'\n'
targets=($(ls | grep -E 'Adobe InDesign*'))
app_dir=($(pwd))
for target in "${targets[@]}"
do
    echo "----------------------"
    echo "Processing '$target'"
    echo "----------------------"
    echo ""
    start_up_path="$app_dir/$target/Scripts/startup scripts";
    # echo "$start_up_path"
    cd "$start_up_path"
    # Try to remove existing installation if exist
    sudo rm -f Canvasflow.jsx & echo "✅ Remove old plugin"

    # Download new version of the plugin
    sudo curl -s -L https://github.com/Canvasflow/canvasflow-for-indesign/releases/download/v1.1.1/Canvasflow.jsx -o Canvasflow.jsx && echo "✅ Download new version"

    # Create base directory
    [[ -z "$CF_USER_BASE_PATH" ]] && cd ~ || cd $CF_USER_BASE_PATH
    mkdir -p cf-indesign && cd cf-indesign && echo "✅ Create base directory"

    # Create resize command
    touch canvasflow_resize.command && chmod +x canvasflow_resize.command && echo "✅ Create resize command"

    # Create convert command
    touch canvasflow_convert.command && chmod +x canvasflow_convert.command && echo "✅ Create convert command"

    # Create Update Script
    rm -f Update.command
    echo '#!/bin/bash' >> Update.command
    echo '' >> Update.command
    echo 'curl https://raw.githubusercontent.com/Canvasflow/canvasflow-for-indesign/master/scripts/install.sh | bash' >> Update.command
    chmod +x Update.command

    chmod -R 777 .

    echo "✅ Create update command"
    echo ""
    
done
IFS=$IFS_backup
echo "🙌 Installation Complete"
    echo ""
    echo "Installation path: $(pwd)"
echo "Please restart InDesign to apply the changes"
echo ""
read -p "Press Enter to close"
exit 0