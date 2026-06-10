package com.embytok.app.ui.screens.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * 设置页
 *
 * 功能：
 *  - 退出登录
 *  - 清理本地缓存（观看历史 / 搜索历史）
 *  - 视频播放相关设置（自动连播、默认静音、倍速等）
 *  - 版本信息
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBack: () -> Unit,
    onLogout: () -> Unit
) {
    // 本地状态（暂不持久化，可后续通过 DataStore 实现）
    var autoPlay by remember { mutableStateOf(true) }
    var isMuted by remember { mutableStateOf(false) }
    var showConfirm by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("设置") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // ===== 播放设置 =====
            item {
                SectionTitle("播放设置")
            }

            item {
                SwitchRow(
                    title = "自动连播下一条",
                    description = "观看完当前视频后自动播放下一条",
                    checked = autoPlay,
                    onCheckedChange = { autoPlay = it }
                )
            }

            item {
                SwitchRow(
                    title = "默认静音",
                    description = "新打开的视频默认静音",
                    checked = isMuted,
                    onCheckedChange = { isMuted = it }
                )
            }

            // ===== 数据与缓存 =====
            item {
                SectionTitle("数据与缓存")
            }

            item {
                TextRow(
                    title = "清除观看历史",
                    description = "仅清除本地保存的观看进度，不影响服务器数据"
                ) {
                    // TODO: 调用 LocalRepository 清空 watch_history
                }
            }

            item {
                TextRow(
                    title = "清除搜索历史",
                    description = "清除最近 10 条搜索记录"
                ) {
                    // TODO: 调用 LocalRepository 清空 search_history
                }
            }

            // ===== 账号 =====
            item {
                SectionTitle("账号")
            }

            item {
                TextRow(
                    title = "退出登录",
                    description = "清除本地服务器配置和 Token",
                    color = Color(0xFFFF5252),
                    onClick = { showConfirm = true }
                )
            }

            // ===== 关于 =====
            item {
                SectionTitle("关于")
            }

            item {
                InfoRow(
                    title = "应用版本",
                    value = "1.0.0"
                )
            }

            item {
                InfoRow(
                    title = "技术栈",
                    value = "Kotlin Multiplatform + Jetpack Compose + ExoPlayer"
                )
            }
        }
    }

    // 退出登录确认对话框
    if (showConfirm) {
        AlertDialog(
            onDismissRequest = { showConfirm = false },
            title = { Text("确认退出？") },
            text = { Text("将清除本地保存的服务器地址、Token 和所有观看历史。此操作不可撤销。") },
            confirmButton = {
                TextButton(onClick = {
                    showConfirm = false
                    onLogout()
                }) {
                    Text("确认退出", color = Color(0xFFFF5252))
                }
            },
            dismissButton = {
                TextButton(onClick = { showConfirm = false }) {
                    Text("取消")
                }
            }
        )
    }
}

@Composable
private fun SectionTitle(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = 16.dp, top = 24.dp, bottom = 8.dp)
    )
}

@Composable
private fun SwitchRow(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, fontSize = 16.sp)
            Text(
                text = description,
                fontSize = 12.sp,
                color = LocalContentColor.current.copy(alpha = 0.6f)
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}

@Composable
private fun TextRow(
    title: String,
    description: String,
    color: Color = Color.Unspecified,
    onClick: () -> Unit
) {
    TextButton(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalAlignment = Alignment.Start
        ) {
            Text(
                text = title,
                fontSize = 16.sp,
                color = if (color != Color.Unspecified) color else LocalContentColor.current
            )
            Text(
                text = description,
                fontSize = 12.sp,
                color = LocalContentColor.current.copy(alpha = 0.6f)
            )
        }
    }
}

@Composable
private fun InfoRow(title: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(text = title, modifier = Modifier.width(120.dp))
        Text(
            text = value,
            fontSize = 14.sp,
            color = LocalContentColor.current.copy(alpha = 0.7f)
        )
    }
}
