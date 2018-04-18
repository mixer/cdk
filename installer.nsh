!macro preInit
    SetRegView 64
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "$LOCALAPPDATA\Microsoft\Mixer\CDK"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation $LOCALAPPDATA\Microsoft\Mixer\CDK"
    SetRegView 32
    WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation $LOCALAPPDATA\Microsoft\Mixer\CDK"
    WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation $LOCALAPPDATA\Microsoft\Mixer\CDK"
!macroend
