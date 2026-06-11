package com.embytok.app.ui.screens.servers

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.domain.model.ServerConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

/**
 * 多服务器管理界面。
 *
 * 功能：
 *  - 显示已保存的所有服务器列表
 *  - 高亮当前活动服务器
 *  - 切换服务器（点击条目即可切换）
 *  - 重命名服务器（点击铅笔图标）
 *  - 删除服务器（点击垃圾桶图标，带确认对话框）
 *  - 添加新服务器入口（跳转登录页）
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServerManagerScreen(
    onBack: () -> Unit,
    onAddNew: () -> Unit,
    onServerSwitched: () -> Unit
) {
    val scope = rememberCoroutineScope()

    // 合并 serverList 和 currentServerId，供 UI 使用
    val listState: StateFlow<Pair<List<ServerConfig>, String?>> = remember {
        combine(
            ServiceLocator.authenticateUseCase.serverListFlow,
            ServiceLocator.authenticateUseCase.currentServerIdFlow
        ) { list, currentId -> Pair(list, currentId) }
    }.let { flow ->
        val initial by flow.collectAsState(initial = Pair(emptyList(), null))
        val state by flow.collectAsState()
        remember(state) { MutableStateFlow(state) }.apply { value = state }
        flow.collectAsState(initial).also { }
        flow
    }.run {
        val s by collectAsState(initial = Pair(emptyList(), null))
        object : StateFlow<Pair<List<ServerConfig>, String?>> {
            override val value: Pair<List<ServerConfig>, String?> get() = s
            override fun collectAsState(
                initial: Pair<List<ServerConfig>, String?>?,
                context: androidx.compose.runtime.snapshots.SnapshotMutationPolicy<Pair<List<ServerConfig>, String?>>?
            ): androidx.compose.runtime.State<Pair<List<ServerConfig>, String?>> =
                this@run.collectAsState(initial = initial ?: emptyList<String>() to null)
        }
    }
    val pair = listState.collectAsState().value
    val servers = pair.first
    val currentId = pair.second

    // 编辑服务器名称
    var editingServer by remember { mutableStateOf<ServerConfig?>(null) }
    var editingName by remember { mutableStateOf("") }

    // 删除确认
    var serverToDelete by remember { mutableStateOf<ServerConfig?>(null) }

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
                .padding(16.dp)
        ) {
            if (servers.isEmpty()) {
                // 空状态
                Box(
                    modifier = Modifier.fillMaxSize().weight(1f),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(
                            Icons.Default.Dns,
                            contentDescription = null,
                            tint = Color(0xFF666666),
                            modifier = Modifier.size(64.dp)
                        )
                        Text(
                            "还没有保存任何服务器",
                            color = Color(0xFFB3B3B3),
                            fontSize = 14.sp
                        )
                    }
                }
            } else {
                // 服务器列表
                LazyColumn(
                    modifier = Modifier.fillMaxWidth().weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(servers, key = { it.id }) { server ->
                        ServerCard(
                            server = server,
                            isActive = server.id == currentId,
                            onClick = {
                                if (server.id != currentId) {
                                    scope.launch {
                                        ServiceLocator.authenticateUseCase.switchToServer(server.id)
                                        onServerSwitched()
                                    }
                                }
                            },
                            onRename = {
                                editingServer = server
                                editingName = server.serverName.ifBlank { server.username }
                            },
                            onDelete = { serverToDelete = server }
                        )
                    }
                }
            }

            Spacer(Modifier.height(20.dp))

            // 添加新服务器按钮
            Button(
                onClick = onAddNew,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE91E63))
            ) {
                Text("添加新服务器", color = Color.White, fontSize = 15.sp)
            }
        }

        // 重命名对话框
        editingServer?.let { server ->
            AlertDialog(
                containerColor = Color(0xFF1A1A1A),
                onDismissRequest = { editingServer = null },
                title = { Text("重命名服务器", color = Color.White, fontSize = 16.sp) },
                text = {
                    OutlinedTextField(
                        value = editingName,
                        onValueChange = { editingName = it },
                        label = { Text("服务器昵称", color = Color(0xFFB3B3B3)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = androidx.compose.material3.TextFieldDefaults.outlinedTextFieldColors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = Color(0xFFE91E63),
                            unfocusedBorderColor = Color(0xFF444444),
                            cursorColor = Color(0xFFE91E63)
                        )
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            scope.launch {
                                ServiceLocator.authenticateUseCase.renameServer(
                                    server.id,
                                    editingName.trim()
                                )
                                editingServer = null
                            }
                        },
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFE91E63))
                    ) { Text("保存") }
                },
                dismissButton = {
                    TextButton(
                        onClick = { editingServer = null },
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFB3B3B3))
                    ) { Text("取消") }
                }
            )
        }

        // 删除确认对话框
        serverToDelete?.let { server ->
            AlertDialog(
                containerColor = Color(0xFF1A1A1A),
                onDismissRequest = { serverToDelete = null },
                title = { Text("删除服务器", color = Color.White, fontSize = 16.sp) },
                text = {
                    Text(
                        text = "确定要删除 \"${server.displayName()}\" 吗？此操作无法撤销。",
                        color = Color(0xFFB3B3B3),
                        fontSize = 14.sp
                    )
                },
                confirmButton = {
                    TextButton(
                        onClick = {
                            scope.launch {
                                ServiceLocator.authenticateUseCase.removeServer(server.id)
                                serverToDelete = null
                            }
                        },
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFE91E63))
                    ) { Text("删除") }
                },
                dismissButton = {
                    TextButton(
                        onClick = { serverToDelete = null },
                        colors = ButtonDefaults.textButtonColors(contentColor = Color(0xFFB3B3B3))
                    ) { Text("取消") }
                }
            )
        }
    }
}

/**
 * 单个服务器条目卡片。
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ServerCard(
    server: ServerConfig,
    isActive: Boolean,
    onClick: () -> Unit,
    onRename: () -> Unit,
    onDelete: () -> Unit
) {
    val borderColor = if (isActive) Color(0xFFE91E63) else Color(0xFF2A2A2A)
    val bgColor = if (isActive) Color(0xFF1A1216) else Color(0xFF1A1A1A)

    Card(
        onClick = onClick,
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor),
        modifier = Modifier.fillMaxWidth()
            .then(
                // 使用边框表示当前活动服务器
                androidx.compose.ui.draw.drawWithContent {
                    drawContent()
                    if (isActive) {
                        drawRoundRect(
                            color = borderColor,
                            size = size,
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2.dp.toPx())
                        )
                    }
                }
            )
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 左侧图标（服务器类型）
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(
                        color = if (isActive) Color(0xFFE91E63) else Color(0xFF2A2A2A),
                        shape = RoundedCornerShape(10.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.Dns,
                    contentDescription = null,
                    tint = if (isActive) Color.White else Color(0xFFB3B3B3),
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(Modifier.width(14.dp))

            // 中间：名称 + 类型 + URL
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = server.displayName(),
                    color = Color.White,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 1,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    val typeLabel = if (server.serverType == com.embytok.domain.model.ServerType.EMBY) "Emby" else "Plex"
                    Text(typeLabel, color = Color(0xFFE91E63), fontSize = 12.sp)
                    Text(" · ", color = Color(0xFF555555), fontSize = 12.sp)
                    Text(
                        server.url,
                        color = Color(0xFF888888),
                        fontSize = 12.sp,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    "用户：${server.username}",
                    color = Color(0xFF888888),
                    fontSize = 12.sp
                )
            }

            // 右侧：活动标记 + 编辑/删除按钮
            if (isActive) {
                Box(
                    modifier = Modifier
                        .padding(end = 8.dp)
                        .background(Color(0xFFE91E63), RoundedCornerShape(6.dp))
                        .padding(horizontal = 6.dp, vertical = 3.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.Check,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text("当前", color = Color.White, fontSize = 11.sp)
                    }
                }
            }

            IconButton(onClick = onRename) {
                Icon(Icons.Default.Edit, contentDescription = "重命名", tint = Color(0xFFB3B3B3))
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, contentDescription = "删除", tint = Color(0xFFB3B3B3))
            }
        }
    }
}
