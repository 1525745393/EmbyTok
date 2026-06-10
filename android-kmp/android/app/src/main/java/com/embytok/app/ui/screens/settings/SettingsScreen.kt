package com.embytok.app.ui.screens.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.embytok.app.ui.di.ServiceLocator
import kotlinx.coroutines.launch

/**
 * 设置界面
 *
 * 展示账户信息与登出功能。使用 ServiceLocator 获取认证用例。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onLogout: () -> Unit,
    onBack: () -> Unit
) {
    val scope = rememberCoroutineScope()
    var showConfirm by remember { mutableStateOf(false) }

    // 当前已保存的配置，用于显示账户信息
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
                .padding(16.dp),
            verticalArrangement = Arrangement.Top
        ) {
            // 账户区块
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
                }
            }

            Spacer(Modifier.height(32.dp))

            // 退出登录
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
