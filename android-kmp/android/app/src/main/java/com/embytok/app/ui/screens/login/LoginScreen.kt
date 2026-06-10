package com.embytok.app.ui.screens.login

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.domain.model.ServerType

/**
 * 登录页面。
 *
 * 支持两种服务器类型（Emby / Plex），根据类型动态显示不同凭据字段。
 */
@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoginSuccess: () -> Unit
) {
    val serverType by viewModel.serverType.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val isLoggedIn by viewModel.isLoggedIn.collectAsState()

    LaunchedEffect(isLoggedIn) {
        if (isLoggedIn) onLoginSuccess()
    }

    // 本地 UI 状态
    var serverTypeExpanded by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) }

    val url by viewModel.serverUrl.collectAsState()
    val username by viewModel.username.collectAsState()
    val password by viewModel.password.collectAsState()
    val apiKey by viewModel.apiKey.collectAsState()
    val accessToken by viewModel.accessToken.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "EmbyTok",
                style = MaterialTheme.typography.headlineLarge,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFE91E63)
            )
            Spacer(Modifier.height(8.dp))
            Text(
                text = "以竖屏视频流的方式浏览个人媒体库",
                style = MaterialTheme.typography.bodyLarge,
                color = Color(0xFFB3B3B3)
            )
            Spacer(Modifier.height(48.dp))

            // ===== 服务器类型选择 =====
            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = if (serverType == ServerType.EMBY) "Emby" else "Plex",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("服务器类型") },
                    trailingIcon = {
                        IconButton(onClick = { serverTypeExpanded = !serverTypeExpanded }) {
                            Text("▼", color = Color.White)
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = outlinedTextFieldColors()
                )
                DropdownMenu(
                    expanded = serverTypeExpanded,
                    onDismissRequest = { serverTypeExpanded = false },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    DropdownMenuItem(
                        text = { Text("Emby") },
                        onClick = {
                            viewModel.setServerType(ServerType.EMBY)
                            serverTypeExpanded = false
                        }
                    )
                    DropdownMenuItem(
                        text = { Text("Plex") },
                        onClick = {
                            viewModel.setServerType(ServerType.PLEX)
                            serverTypeExpanded = false
                        }
                    )
                }
            }
            Spacer(Modifier.height(12.dp))

            // ===== 服务器地址 =====
            OutlinedTextField(
                value = url,
                onValueChange = viewModel::setServerUrl,
                label = { Text("服务器地址") },
                placeholder = { Text("http://192.168.1.10:8096") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                colors = outlinedTextFieldColors()
            )
            Spacer(Modifier.height(12.dp))

            // ===== Emby 专有字段：用户名/密码/API Key =====
            if (serverType == ServerType.EMBY) {
                OutlinedTextField(
                    value = username,
                    onValueChange = viewModel::setUsername,
                    label = { Text("用户名") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = outlinedTextFieldColors()
                )
                Spacer(Modifier.height(12.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = viewModel::setPassword,
                    label = { Text("密码") },
                    visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(onClick = { passwordVisible = !passwordVisible }) {
                            Icon(
                                imageVector = if (passwordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = "切换密码可见性",
                                tint = Color.White
                            )
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = outlinedTextFieldColors()
                )
                Spacer(Modifier.height(12.dp))

                OutlinedTextField(
                    value = apiKey,
                    onValueChange = viewModel::setApiKey,
                    label = { Text("API Key（可选）") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = outlinedTextFieldColors()
                )
                Spacer(Modifier.height(12.dp))
            }

            // ===== Plex 专有字段：Access Token =====
            if (serverType == ServerType.PLEX) {
                OutlinedTextField(
                    value = accessToken,
                    onValueChange = viewModel::setAccessToken,
                    label = { Text("Access Token") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = outlinedTextFieldColors()
                )
                Spacer(Modifier.height(12.dp))
            }

            // ===== 错误提示 =====
            if (!errorMessage.isNullOrEmpty()) {
                Text(
                    text = errorMessage!!,
                    color = Color(0xFFCF6679),
                    style = MaterialTheme.typography.bodySmall,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(12.dp))
            }

            // ===== 登录按钮 =====
            Button(
                onClick = { viewModel.login(onLoginSuccess) },
                enabled = !isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFFE91E63)
                )
            ) {
                if (isLoading) {
                    CircularProgressIndicator(color = Color.White)
                } else {
                    Text(
                        text = "登录",
                        fontWeight = FontWeight.Bold,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun outlinedTextFieldColors() =
    OutlinedTextFieldDefaults.colors(
        focusedTextColor = Color.White,
        unfocusedTextColor = Color.White,
        focusedBorderColor = Color(0xFFE91E63),
        unfocusedBorderColor = Color(0xFF666666),
        disabledBorderColor = Color(0xFF666666),
        cursorColor = Color(0xFFE91E63),
        focusedLabelColor = Color(0xFFE91E63),
        unfocusedLabelColor = Color(0xFFB3B3B3),
        focusedPlaceholderColor = Color(0xFF666666),
        unfocusedPlaceholderColor = Color(0xFF666666)
    )
