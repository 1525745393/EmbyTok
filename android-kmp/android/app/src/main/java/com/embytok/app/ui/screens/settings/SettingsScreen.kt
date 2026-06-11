package com.embytok.app.ui.screens.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.embytok.app.ui.di.ServiceLocator
import kotlinx.coroutines.launch

/**
 * 设置界面
 *
 * 包含：
 *  - 账户信息展示（服务器类型、地址、用户名）+ 管理服务器入口
 *  - 播放设置（默认倍速、自动播放、字幕开关）
 *  - 观看历史入口
 *  - 退出登录
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onLogout: () -> Unit,
    onOpenServerManager: () -> Unit,
    onOpenHistory: () -> Unit,
    onBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var showConfirm by remember { mutableStateOf(false) }

    // 播放设置状态
    var defaultSpeed by remember { mutableStateOf(1.0f) }
    var autoPlay by remember { mutableStateOf(true) }
    var enableSubtitles by remember { mutableStateOf(true) }
    var speedMenuExpanded by remember { mutableStateOf(false) }

    // 当前已保存的配置
    val currentConfig = ServiceLocator.authenticateUseCase.currentConfigCached()

    Scaffold(
        containerColor = Color(0xFF0A0A0A),
        topBar = {
            TopAppBar(
                title = { Text("设置", color = Color.White) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0A0A0A),
                    titleContentColor = Color.White
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // ============ 账户区块 ============
            Text(
                "账户",
                color = Color(0xFFB3B3B3),
                fontSize = 14.sp,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A))
            ) {
                Column(Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("服务器类型", color = Color.White)
                        Text(
                            when (currentConfig?.serverType?.name) {
                                "EMBY" -> "Emby"
                                "PLEX" -> "Plex"
                                else -> "未知"
                            },
                            color = Color(0xFFE91E63)
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("服务器地址", color = Color.White)
                        Text(currentConfig?.url.orEmpty(), color = Color(0xFFE91E63), fontSize = 12.sp)
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("用户名", color = Color.White)
                        Text(currentConfig?.username.orEmpty(), color = Color(0xFFE91E63))
                    }
                    Spacer(Modifier.height(16.dp))
                    // 管理服务器按钮
                    Button(
                        onClick = onOpenServerManager,
                        modifier = Modifier.fillMaxWidth().height(40.dp),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF2A2A2A),
                            contentColor = Color(0xFFE91E63)
                        )
                    ) {
                        Text("管理服务器", color = Color(0xFFE91E63), fontSize = 14.sp)
                        Spacer(Modifier.weight(1f))
                        Icon(
                            Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = Color(0xFFE91E63),
                            modifier = Modifier.height(18.dp)
                        )
                    }
                }
            }

            // ============ 播放设置区块 ============
            Spacer(Modifier.height(24.dp))
            Text(
                "播放设置",
                color = Color(0xFFB3B3B3),
                fontSize = 14.sp,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A))
            ) {
                Column(Modifier.padding(16.dp)) {
                    // 默认倍速选择
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("默认倍速", color = Color.White)
                        ExposedDropdownMenuBox(
                            expanded = speedMenuExpanded,
                            onExpandedChange = { speedMenuExpanded = !speedMenuExpanded }
                        ) {
                            TextField(
                                value = "${defaultSpeed}x",
                                onValueChange = {},
                                readOnly = true,
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = speedMenuExpanded)
                                },
                                colors = androidx.compose.material3.TextFieldDefaults.colors(
                                    focusedContainerColor = Color(0xFF2A2A2A),
                                    unfocusedContainerColor = Color(0xFF2A2A2A),
                                    focusedTextColor = Color(0xFFE91E63),
                                    unfocusedTextColor = Color(0xFFE91E63)
                                ),
                                modifier = Modifier
                                    .menuAnchor()
                                    .width(100.dp)
                            )
                            ExposedDropdownMenu(
                                expanded = speedMenuExpanded,
                                onDismissRequest = { speedMenuExpanded = false },
                                containerColor = Color(0xFF2A2A2A)
                            ) {
                                listOf(0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 2.0f).forEach { speed ->
                                    DropdownMenuItem(
                                        text = { Text("${speed}x", color = Color.White) },
                                        onClick = {
                                            defaultSpeed = speed
                                            speedMenuExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(16.dp))
                    // 自动播放下一个
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("自动播放下一个", color = Color.White)
                        Switch(
                            checked = autoPlay,
                            onCheckedChange = { autoPlay = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color(0xFFE91E63),
                                checkedTrackColor = Color(0xFFE91E63).copy(alpha = 0.5f)
                            )
                        )
                    }
                    Spacer(Modifier.height(16.dp))
                    // 启用字幕
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("启用字幕", color = Color.White)
                        Switch(
                            checked = enableSubtitles,
                            onCheckedChange = { enableSubtitles = it },
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color(0xFFE91E63),
                                checkedTrackColor = Color(0xFFE91E63).copy(alpha = 0.5f)
                            )
                        )
                    }
                }
            }

            // ============ 历史记录 ============
            Spacer(Modifier.height(24.dp))
            Text(
                "历史",
                color = Color(0xFFB3B3B3),
                fontSize = 14.sp,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Button(
                onClick = onOpenHistory,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF1A1A1A)
                )
            ) {
                Text("观看历史", color = Color.White, fontSize = 15.sp)
                Spacer(Modifier.weight(1f))
                Icon(
                    Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = Color(0xFF888888),
                    modifier = Modifier.height(20.dp)
                )
            }

            Spacer(Modifier.height(32.dp))

            // ============ 退出登录 ============
            Button(
                onClick = { showConfirm = true },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE91E63))
            ) {
                Text("退出登录", color = Color.White, fontSize = 16.sp)
            }

            // 退出确认对话框
            if (showConfirm) {
                androidx.compose.material3.AlertDialog(
                    onDismissRequest = { showConfirm = false },
                    title = { Text("确认退出", color = Color.White) },
                    text = { Text("退出后需要重新输入服务器信息。", color = Color(0xFFB3B3B3)) },
                    confirmButton = {
                        Button(
                            onClick = {
                                scope.launch {
                                    ServiceLocator.authenticateUseCase.logout()
                                    showConfirm = false
                                    onLogout()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE91E63))
                        ) { Text("确认", color = Color.White) }
                    },
                    dismissButton = {
                        Button(
                            onClick = { showConfirm = false },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2A2A2A))
                        ) { Text("取消", color = Color.White) }
                    },
                    containerColor = Color(0xFF1A1A1A)
                )
            }

            Spacer(Modifier.height(32.dp))
            Text(
                "EmbyTok Android\n版本 1.0.0",
                color = Color(0xFF666666),
                fontSize = 12.sp,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
