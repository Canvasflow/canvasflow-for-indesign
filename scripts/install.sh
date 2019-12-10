#!/bin/bash
reset
clear

echo "You need admin rights to install the Canvasflow plugin"
echo "Please insert your password 🔓"
echo ""
sudo echo "Initializing plugin update"
if sudo -n true 2>/dev/null; then 
    echo ""
else
    echo ""
    echo "😞 Authentication failed, please try again"
    echo ""
    read -p "Press enter to close"
    clear
    exit 1
fi

cd "/Applications"
cd "`ls | grep -E 'Adobe InDesign*'`"
cd "./Scripts/startup scripts"

# Try to remove existing installation if exist
sudo rm -f Canvasflow.jsx && echo "✅ Remove plugin older version"

# Download new version of the plugin
sudo curl -s -L https://github.com/Canvasflow/canvasflow-for-indesign/releases/download/v0.14.4/Canvasflow.jsx -o Canvasflow.jsx && echo "✅ Download plugin newer version"

# Create plugin installation folder
cd ~
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
echo "🙌 Installation Complete"
echo ""
echo "You need to restart InDesign so the changes apply"

echo ""
read -p "Press enter to close"
exit 0