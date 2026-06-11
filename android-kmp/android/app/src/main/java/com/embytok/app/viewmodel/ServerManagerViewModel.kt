package com.embytok.app.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType
import com.embytok.network.ClientFactory
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/**
 * 多服务器管理 ViewModel
 *
 * 功能：
 *  - 显示已保存的所有服务器列表
 *  - 添加新服务器（支持 Emby/Plex）
 *  - 删除服务器
 *  - 测试服务器连接状态
 *  - 切换当前活跃服务器
 */
class ServerManagerViewModel(application: Application) : AndroidViewModel(application) {

    data class ServerItem(
        val config: ServerConfig,
        val isActive: Boolean = false,
        val isConnecting: Boolean = false,
        val isConnected: Boolean? = null // null = 未测试, true = 成功, false = 失败
    )

    data class ManagerState(
        val servers: List<ServerItem> = emptyList(),
        val isLoading: Boolean = false,
        val error: String? = null
    )

    // 添加服务器表单状态
    data class AddServerState(
        val serverType: ServerType = ServerType.EMBY,
        val serverUrl: String = "",
        val username: String = "",
        val password: String = "",
        val apiKey: String = "",
        val accessToken: String = "",
        val isLoading: Boolean = false,
        val error: String? = null
    )

    private val _state = MutableStateFlow(ManagerState())
    val state: StateFlow<ManagerState> = _state.asStateFlow()

    private val _addState = MutableStateFlow(AddServerState())
    val addState: StateFlow<AddServerState> = _addState.asStateFlow()

    private val preferences = ServiceLocator.preferences
    private val authenticateUseCase = ServiceLocator.authenticateUseCase

    init {
        loadServers()
    }

    fun loadServers() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            val savedServers = preferences.savedServers.stateIn(
                viewModelScope, SharingStarted.Eagerly, emptyList()
            ).value
            val currentActive = preferences.serverConfig.stateIn(
                viewModelScope, SharingStarted.Eagerly, null
            ).value

            val items = savedServers.map { server ->
                ServerItem(
                    config = server,
                    isActive = server.url == currentActive?.url
                )
            }
            _state.value = ManagerState(servers = items, isLoading = false)
        }
    }

    fun setServerType(type: ServerType) {
        _addState.value = _addState.value.copy(serverType = type)
    }

    fun setServerUrl(url: String) {
        _addState.value = _addState.value.copy(serverUrl = url)
    }

    fun setUsername(username: String) {
        _addState.value = _addState.value.copy(username = username)
    }

    fun setPassword(password: String) {
        _addState.value = _addState.value.copy(password = password)
    }

    fun setApiKey(apiKey: String) {
        _addState.value = _addState.value.copy(apiKey = apiKey)
    }

    fun setAccessToken(token: String) {
        _addState.value = _addState.value.copy(accessToken = token)
    }

    /**
     * 添加新服务器（登录并保存）
     */
    fun addServer(onSuccess: () -> Unit) {
        val add = _addState.value
        if (add.serverUrl.isBlank()) {
            _addState.value = add.copy(error = "服务器地址不能为空")
            return
        }

        viewModelScope.launch {
            _addState.value = add.copy(isLoading = true, error = null)

            val result = authenticateUseCase.execute(
                serverType = add.serverType,
                serverUrl = add.serverUrl,
                username = add.username,
                password = add.password.ifBlank { null },
                apiKey = add.apiKey.ifBlank { null },
                accessToken = add.accessToken.ifBlank { null }
            )

            result.fold(
                onSuccess = {
                    // 保存到多服务器列表
                    val config = authenticateUseCase.currentConfigCached()
                    if (config != null) {
                        preferences.addServer(config)
                    }
                    // 重置表单
                    _addState.value = AddServerState()
                    loadServers()
                    onSuccess()
                },
                onFailure = { e ->
                    _addState.value = _addState.value.copy(
                        isLoading = false,
                        error = e.message ?: "连接失败"
                    )
                }
            )
        }
    }

    /**
     * 删除服务器
     */
    fun removeServer(serverUrl: String) {
        viewModelScope.launch {
            preferences.removeServer(serverUrl)
            loadServers()
        }
    }

    /**
     * 切换到指定服务器
     */
    fun switchToServer(server: ServerConfig) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            // 更新当前活跃服务器
            preferences.setActiveServer(server)
            loadServers()
        }
    }

    /**
     * 测试服务器连接状态
     */
    fun testServer(server: ServerConfig) {
        viewModelScope.launch {
            // 标记为正在连接
            val items = _state.value.servers.map {
                if (it.config.url == server.url) it.copy(isConnecting = true) else it
            }
            _state.value = _state.value.copy(servers = items)

            val client = ClientFactory.create(server)
            val connected = client.ping().isSuccess
            val updated = _state.value.servers.map {
                if (it.config.url == server.url) it.copy(isConnecting = false, isConnected = connected) else it
            }
            _state.value = _state.value.copy(servers = updated)
        }
    }

    /**
     * 重置添加表单
     */
    fun resetAddForm() {
        _addState.value = AddServerState()
    }

    /**
     * 清除添加表单错误
     */
    fun clearError() {
        _addState.value = _addState.value.copy(error = null)
    }
}
