package com.embytok.app.ui.screens.server

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.embytok.app.viewmodel.ServerManagerViewModel
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType

/**
 * 多服务器管理界面
 *
 * 功能：
 *  - 显示已保存的服务器列表
 *  - 标记当前活跃服务器
 *  - 添加新服务器
 *  - 删除服务器
 *  - 测试连接状态
 *  - 切换活跃服务器
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServerManagerScreen(
    viewModel: ServerManagerViewModel = viewModel(),
    onBack: () -> Unit,
    onServerSwitched: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val addState by viewModel.addState.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }

    Scaffold(
        containerColor = Color(0xFF0A0A0A),
        topBar = {
            TopAppBar(
                title = { Text("服务器管理", color = Color.White) },
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
        ) {
            // 加载指示器
            if (state.isLoading) {
                LinearProgressIndicator(
                    modifier = Modifier.fillMaxWidth(),
                    color = Color(0xFFE91E63)
                )
            }

            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item { Spacer(Modifier.height(8.dp)) }

                if (state.servers.isEmpty()) {
                    item {
                        EmptyServersPlaceholder()
                    }
                }

                items(state.servers, key = { it.config.url }) { item ->
                    ServerCard(
                        item = item,
                        onSwitch = {
                            viewModel.switchToServer(item.config)
                            onServerSwitched()
                        },
                        onTest = { viewModel.testServer(item.config) },
                        onDelete = { viewModel.removeServer(item.config.url) }
                    )
                }

                item {
                    Spacer(Modifier.height(8.dp))
                    // 添加服务器按钮
                    Button(
                        onClick = {
                            viewModel.resetAddForm()
                            showAddDialog = true
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF1A1A1A)
                        )
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, tint = Color(0xFFE91E63))
                        Spacer(Modifier.width(8.dp))
                        Text("添加服务器", color = Color(0xFFE91E63))
                    }
                    Spacer(Modifier.height(24.dp))
                }
            }
        }

        // 添加服务器弹窗
        if (showAddDialog) {
            AddServerDialog(
                state = addState,
                onDismiss = { showAddDialog = false },
                onServerTypeChange = viewModel::setServerType,
                onServerUrlChange = viewModel::setServerUrl,
                onUsernameChange = viewModel::setUsername,
                onPasswordChange = viewModel::setPassword,
                onApiKeyChange = viewModel::setApiKey,
                onAccessTokenChange = viewModel::setAccessToken,
                onConfirm = {
                    viewModel.addServer {
                        showAddDialog = false
                        onServerSwitched()
                    }
                }
            )
        }
    }
}

@Composable
private fun ServerCard(
    item: ServerManagerViewModel.ServerItem,
    onSwitch: () -> Unit,
    onTest: () -> Unit,
    onDelete: () -> Unit
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }
    val server = item.config

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (item.isActive) Color(0xFF1A1A1A) else Color(0xFF161616)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // 活跃指示器
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .background(
                            if (item.isActive) Color(0xFF4CAF50) else Color(0xFF555555),
                            CircleShape
                        )
                )
                Spacer(Modifier.width(12.dp))

                // 服务器信息
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = server.serverName.ifBlank { server.username },
                            color = Color.White,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (item.isActive) {
                            Spacer(Modifier.width(8.dp))
                            Box(
                                modifier = Modifier
                                    .background(Color(0xFF4CAF50).copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text("当前", color = Color(0xFF4CAF50), fontSize = 10.sp)
                            }
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = if (server.serverType == ServerType.EMBY) "Emby" else "Plex",
                        color = Color(0xFFE91E63),
                        fontSize = 12.sp
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = server.url,
                        color = Color(0xFF666666),
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // 连接状态
                when {
                    item.isConnecting -> {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = Color(0xFFE91E63),
                            strokeWidth = 2.dp
                        )
                    }
                    item.isConnected == true -> {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = "已连接",
                            tint = Color(0xFF4CAF50),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    item.isConnected == false -> {
                        Icon(
                            Icons.Default.Close,
                            contentDescription = "连接失败",
                            tint = Color(0xFFCF6679),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // 操作按钮行
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.End
            ) {
                // 删除按钮
                TextButton(
                    onClick = { showDeleteConfirm = true },
                    colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFCF6679))
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("删除", fontSize = 12.sp)
                }

                // 测试按钮
                TextButton(
                    onClick = onTest,
                    enabled = !item.isConnecting,
                    colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFF888888))
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("测试", fontSize = 12.sp)
                }

                // 切换按钮
                if (!item.isActive) {
                    TextButton(
                        onClick = onSwitch,
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFE91E63))
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("切换", fontSize = 12.sp)
                    }
                }
            }

            // 删除确认
            AnimatedVisibility(visible = showDeleteConfirm) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("确认删除？", color = Color(0xFFCF6679), fontSize = 13.sp)
                    Spacer(Modifier.width(12.dp))
                    TextButton(onClick = { showDeleteConfirm = false }) {
                        Text("取消", color = Color(0xFF888888), fontSize = 12.sp)
                    }
                    TextButton(onClick = {
                        showDeleteConfirm = false
                        onDelete()
                    }) {
                        Text("确认", color = Color(0xFFCF6679), fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun AddServerDialog(
    state: ServerManagerViewModel.AddServerState,
    onDismiss: () -> Unit,
    onServerTypeChange: (ServerType) -> Unit,
    onServerUrlChange: (String) -> Unit,
    onUsernameChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onApiKeyChange: (String) -> Unit,
    onAccessTokenChange: (String) -> Unit,
    onConfirm: () -> Unit
) {
    var serverTypeExpanded by remember { mutableStateOf(false) }
    var passwordVisible by remember { mutableStateOf(false) }

    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1A1A1A),
        title = {
            Text("添加服务器", color = Color.White, fontWeight = FontWeight.Bold)
        },
        text = {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    // 服务器类型
                    ExposedDropdownMenuBox(
                        expanded = serverTypeExpanded,
                        onExpandedChange = { serverTypeExpanded = !serverTypeExpanded }
                    ) {
                        OutlinedTextField(
                            value = if (state.serverType == ServerType.EMBY) "Emby" else "Plex",
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("服务器类型", color = Color(0xFFB3B3B3)) },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = serverTypeExpanded)
                            },
                            colors = dialogTextFieldColors(),
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor()
                        )
                        ExposedDropdownMenu(
                            expanded = serverTypeExpanded,
                            onDismissRequest = { serverTypeExpanded = false },
                            containerColor = Color(0xFF2A2A2A)
                        ) {
                            DropdownMenuItem(
                                text = { Text("Emby", color = Color.White) },
                                onClick = {
                                    onServerTypeChange(ServerType.EMBY)
                                    serverTypeExpanded = false
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Plex", color = Color.White) },
                                onClick = {
                                    onServerTypeChange(ServerType.PLEX)
                                    serverTypeExpanded = false
                                }
                            )
                        }
                    }
                }

                item {
                    OutlinedTextField(
                        value = state.serverUrl,
                        onValueChange = onServerUrlChange,
                        label = { Text("服务器地址", color = Color(0xFFB3B3B3)) },
                        placeholder = { Text("http://192.168.1.10:8096", color = Color(0xFF666666)) },
                        singleLine = true,
                        colors = dialogTextFieldColors(),
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                if (state.serverType == ServerType.EMBY) {
                    item {
                        OutlinedTextField(
                            value = state.username,
                            onValueChange = onUsernameChange,
                            label = { Text("用户名", color = Color(0xFFB3B3B3)) },
                            singleLine = true,
                            colors = dialogTextFieldColors(),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = state.password,
                            onValueChange = onPasswordChange,
                            label = { Text("密码", color = Color(0xFFB3B3B3)) },
                            singleLine = true,
                            visualTransformation = if (passwordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            colors = dialogTextFieldColors(),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                    item {
                        OutlinedTextField(
                            value = state.apiKey,
                            onValueChange = onApiKeyChange,
                            label = { Text("API Key（可选）", color = Color(0xFFB3B3B3)) },
                            singleLine = true,
                            colors = dialogTextFieldColors(),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                } else {
                    item {
                        OutlinedTextField(
                            value = state.accessToken,
                            onValueChange = onAccessTokenChange,
                            label = { Text("Access Token", color = Color(0xFFB3B3B3)) },
                            singleLine = true,
                            colors = dialogTextFieldColors(),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                if (!state.error.isNullOrBlank()) {
                    item {
                        Text(
                            text = state.error,
                            color = Color(0xFFCF6679),
                            fontSize = 12.sp
                        )
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onConfirm,
                enabled = !state.isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE91E63))
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("添加", color = Color.White)
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消", color = Color(0xFF888888))
            }
        }
    )
}

@Composable
private fun EmptyServersPlaceholder() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "📺",
            fontSize = 48.sp
        )
        Spacer(Modifier.height(16.dp))
        Text(
            text = "暂无已保存的服务器",
            color = Color(0xFF888888),
            fontSize = 14.sp
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = "点击上方按钮添加你的第一个服务器",
            color = Color(0xFF555555),
            fontSize = 12.sp
        )
    }
}

@Composable
private fun dialogTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White,
    focusedBorderColor = Color(0xFFE91E63),
    unfocusedBorderColor = Color(0xFF444444),
    cursorColor = Color(0xFFE91E63),
    focusedLabelColor = Color(0xFFE91E63),
    unfocusedLabelColor = Color(0xFF888888)
)

@Composable
private fun LinearProgressIndicator(modifier: Modifier) {
    Box(
        modifier = modifier
            .height(2.dp)
            .background(Color(0xFF2A2A2A))
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(0.3f)
                .height(2.dp)
                .background(Color(0xFFE91E63))
        )
    }
}
