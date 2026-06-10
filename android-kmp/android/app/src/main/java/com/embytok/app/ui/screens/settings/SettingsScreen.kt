package com.embytok.app.ui.screens.settings

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.embytok.app.R
import com.embytok.app.viewmodel.SettingsUiState
import com.embytok.app.viewmodel.SettingsViewModel
import com.embytok.domain.model.OrientationMode
import org.koin.androidx.compose.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onLogout: () -> Unit,
    viewModel: SettingsViewModel = koinViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showLogoutDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.nav_settings)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.cd_back)
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
        ) {
            // 账户区
            SettingsSection(title = stringResource(R.string.settings_account)) {
                SettingsItem(
                    icon = Icons.Default.Person,
                    title = stringResource(R.string.settings_account),
                    subtitle = "user@example.com", // TODO: 显示实际用户名
                    onClick = { }
                )

                SettingsItem(
                    icon = Icons.AutoMirrored.Filled.Logout,
                    title = stringResource(R.string.settings_logout),
                    onClick = { showLogoutDialog = true }
                )
            }

            // 显示设置
            SettingsSection(title = stringResource(R.string.settings_display)) {
                // 方向过滤
                SettingsItem(
                    icon = Icons.Default.FilterHdr,
                    title = stringResource(R.string.settings_display),
                    subtitle = when (uiState.orientationMode) {
                        OrientationMode.VERTICAL -> stringResource(R.string.settings_orientation_vertical)
                        OrientationMode.HORIZONTAL -> stringResource(R.string.settings_orientation_horizontal)
                        OrientationMode.BOTH -> stringResource(R.string.settings_orientation_both)
                    },
                    onClick = { }
                )

                // 自动连播
                SettingsSwitchItem(
                    icon = Icons.Default.PlayCircle,
                    title = stringResource(R.string.settings_auto_play),
                    checked = uiState.isAutoPlay,
                    onCheckedChange = { viewModel.setAutoPlay(it) }
                )

                // 默认静音
                SettingsSwitchItem(
                    icon = Icons.Default.VolumeOff,
                    title = stringResource(R.string.settings_muted_by_default),
                    checked = uiState.isMuted,
                    onCheckedChange = { viewModel.setMuted(it) }
                )
            }

            // 语言设置
            SettingsSection(title = stringResource(R.string.settings_language)) {
                SettingsItem(
                    icon = Icons.Default.Language,
                    title = stringResource(R.string.settings_language),
                    subtitle = uiState.language,
                    onClick = { }
                )
            }

            // 关于
            SettingsSection(title = stringResource(R.string.settings_about)) {
                SettingsItem(
                    icon = Icons.Default.Info,
                    title = stringResource(R.string.settings_version),
                    subtitle = "v${uiState.appVersion}",
                    onClick = { }
                )

                SettingsItem(
                    icon = Icons.Default.Update,
                    title = stringResource(R.string.settings_check_update),
                    subtitle = if (uiState.isCheckingUpdate) "检查中..."
                               else if (uiState.updateAvailable) "有新版本: ${uiState.latestVersion}"
                               else "已是最新版本",
                    onClick = { viewModel.checkForUpdates() }
                )

                SettingsItem(
                    icon = Icons.Default.Code,
                    title = stringResource(R.string.about_open_source),
                    subtitle = stringResource(R.string.about_github),
                    onClick = { /* TODO: 打开 GitHub */ }
                )
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }

    // 退出登录确认对话框
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text(stringResource(R.string.settings_logout)) },
            text = { Text(stringResource(R.string.exit_confirm)) },
            confirmButton = {
                TextButton(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    }
                ) {
                    Text(stringResource(R.string.confirm))
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text(stringResource(R.string.cancel))
                }
            }
        )
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        content()
        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
    }
}

@Composable
private fun SettingsItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String? = null,
    onClick: () -> Unit
) {
    ListItem(
        headlineContent = { Text(title) },
        supportingContent = subtitle?.let { { Text(it) } },
        leadingContent = {
            Icon(
                icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        modifier = Modifier.clickable(onClick = onClick)
    )
}

@Composable
private fun SettingsSwitchItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    ListItem(
        headlineContent = { Text(title) },
        leadingContent = {
            Icon(
                icon,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
        },
        trailingContent = {
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange
            )
        }
    )
}
