package com.embytok.app.ui.screens.login

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.domain.model.ServerType

/**
 * 登录屏幕
 *
 * 支持两种模式：
 *  - Emby: 通过 用户名 + 密码 认证
 *  - Plex: 通过 Token 认证
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoginSuccess: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    // 当 isLoggedIn 变为 true 时触发回调
    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) {
            onLoginSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Logo / Title
            Text(
                text = "EmbyTok",
                style = MaterialTheme.typography.headlineLarge,
                color = MaterialTheme.colorScheme.primary,
                fontSize = 36.sp
            )

            Text(
                text = "为 Emby/Plex 打造的竖屏视频体验",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )

            Spacer(Modifier.height(24.dp))

            // 服务器类型切换
            ServerTypeSelector(
                selected = uiState.serverType,
                onSelected = viewModel::updateServerType
            )

            // URL 输入
            TextField(
                value = uiState.url,
                onValueChange = viewModel::updateUrl,
                label = { Text("服务器地址") },
                placeholder = { Text("https://emby.example.com") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(8.dp),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri)
            )

            // 条件字段：根据服务器类型显示不同的输入
            if (uiState.serverType == ServerType.EMBY) {
                // Emby: 用户名 + 密码
                TextField(
                    value = uiState.username,
                    onValueChange = viewModel::updateUsername,
                    label = { Text("用户名") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                )

                PasswordField(
                    value = uiState.password,
                    onValueChange = viewModel::updatePassword,
                    label = "密码"
                )
            } else {
                // Plex: Token
                TextField(
                    value = uiState.token,
                    onValueChange = viewModel::updateToken,
                    label = { Text("Plex Token") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    visualTransformation = PasswordVisualTransformation()
                )

                Text(
                    text = "提示：在 plex.tv 网页版登录后，访问 https://plex.tv/api/resources 可获取 token",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // 错误提示
            if (uiState.error != null) {
                Text(
                    text = uiState.error!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.fillMaxWidth()
                )
            }

            Spacer(Modifier.height(8.dp))

            // 登录按钮
            Button(
                onClick = viewModel::login,
                enabled = !uiState.isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(8.dp)
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        color = Color.White,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text("正在连接…")
                } else {
                    Text("登录", fontSize = 16.sp)
                }
            }

            Text(
                text = "本地收藏、观看历史等数据保存在设备本地",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
            )
        }
    }
}

/**
 * 服务器类型切换（Emby / Plex）
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ServerTypeSelector(
    selected: ServerType,
    onSelected: (ServerType) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                color = MaterialTheme.colorScheme.surfaceVariant,
                shape = RoundedCornerShape(8.dp)
            ),
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        ServerType.values().forEach { type ->
            val isSelected = selected == type
            FilterChip(
                selected = isSelected,
                onClick = { onSelected(type) },
                label = {
                    Text(
                        text = type.name,
                        color = if (isSelected) Color.White
                        else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                },
                modifier = Modifier
                    .weight(1f)
                    .padding(4.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primary
                )
            )
        }
    }
}

/**
 * 密码输入框（带显示/隐藏切换）
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PasswordField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String
) {
    var showPassword by remember { mutableStateOf(false) }

    TextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
        trailingIcon = {
            IconButton(onClick = { showPassword = !showPassword }) {
                Icon(
                    imageVector = if (showPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                    contentDescription = if (showPassword) "隐藏密码" else "显示密码"
                )
            }
        },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password)
    )
}
