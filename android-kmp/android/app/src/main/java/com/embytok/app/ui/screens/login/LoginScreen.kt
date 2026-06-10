package com.embytok.app.ui.screens.login

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.embytok.app.R
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.app.viewmodel.LoginUiState
import com.embytok.domain.model.ServerType

@Composable
fun LoginScreen(
    viewModel: LoginViewModel,
    onLoginSuccess: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val focusManager = LocalFocusManager.current

    // 登录成功时触发回调
    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) {
            onLoginSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Logo 区域
            Text(
                text = "EmbyTok",
                style = MaterialTheme.typography.displayMedium,
                color = MaterialTheme.colorScheme.primary
            )

            Text(
                text = "Emby & Plex 竖屏视频客户端",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Spacer(modifier = Modifier.height(48.dp))

            // 服务器类型选择
            ServerTypeSelector(
                selectedType = uiState.serverType,
                onTypeSelected = { viewModel.updateServerType(it) }
            )

            Spacer(modifier = Modifier.height(24.dp))

            // 登录表单
            LoginForm(
                uiState = uiState,
                onUrlChange = { viewModel.updateUrl(it) },
                onUsernameChange = { viewModel.updateUsername(it) },
                onPasswordChange = { viewModel.updatePassword(it) },
                onTokenChange = { viewModel.updateToken(it) },
                onLogin = {
                    focusManager.clearFocus()
                    viewModel.login()
                },
                onClearError = { viewModel.clearError() }
            )

            // 错误提示
            uiState.error?.let { error ->
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                    textAlign = TextAlign.Center
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            // 登录按钮
            Button(
                onClick = { viewModel.login() },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                enabled = !uiState.isLoading
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text(
                        text = stringResource(R.string.login_submit),
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}

@Composable
private fun ServerTypeSelector(
    selectedType: ServerType,
    onTypeSelected: (ServerType) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        ServerType.entries.forEach { type ->
            FilterChip(
                selected = selectedType == type,
                onClick = { onTypeSelected(type) },
                label = {
                    Text(
                        text = when (type) {
                            ServerType.EMBY -> stringResource(R.string.login_emby)
                            ServerType.PLEX -> stringResource(R.string.login_plex)
                        }
                    )
                },
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun LoginForm(
    uiState: LoginUiState,
    onUrlChange: (String) -> Unit,
    onUsernameChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onTokenChange: (String) -> Unit,
    onLogin: () -> Unit,
    onClearError: () -> Unit
) {
    val focusManager = LocalFocusManager.current

    // 服务器地址
    OutlinedTextField(
        value = uiState.url,
        onValueChange = {
            onUrlChange(it)
            onClearError()
        },
        label = { Text(stringResource(R.string.login_server_address)) },
        placeholder = { Text("192.168.1.100:8096") },
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
        keyboardOptions = KeyboardOptions(
            keyboardType = KeyboardType.Uri,
            imeAction = if (uiState.serverType == ServerType.EMBY) ImeAction.Next else ImeAction.Done
        ),
        keyboardActions = KeyboardActions(
            onNext = { focusManager.moveFocus(FocusDirection.Down) },
            onDone = { onLogin() }
        )
    )

    Spacer(modifier = Modifier.height(16.dp))

    if (uiState.serverType == ServerType.EMBY) {
        // Emby 用户名
        OutlinedTextField(
            value = uiState.username,
            onValueChange = {
                onUsernameChange(it)
                onClearError()
            },
            label = { Text(stringResource(R.string.login_username)) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
            keyboardActions = KeyboardActions(
                onNext = { focusManager.moveFocus(FocusDirection.Down) }
            )
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Emby 密码
        OutlinedTextField(
            value = uiState.password,
            onValueChange = {
                onPasswordChange(it)
                onClearError()
            },
            label = { Text(stringResource(R.string.login_password)) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(
                onDone = { onLogin() }
            )
        )
    } else {
        // Plex Token
        OutlinedTextField(
            value = uiState.token,
            onValueChange = {
                onTokenChange(it)
                onClearError()
            },
            label = { Text(stringResource(R.string.login_plex_token)) },
            placeholder = { Text(stringResource(R.string.login_plex_token)) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(
                keyboardType = KeyboardType.Password,
                imeAction = ImeAction.Done
            ),
            keyboardActions = KeyboardActions(
                onDone = { onLogin() }
            )
        )
    }
}
