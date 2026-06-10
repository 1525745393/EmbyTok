package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.preferences.AppPreferences
import com.embytok.app.usecase.AuthenticateUseCase
import com.embytok.domain.model.ServerType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

/**
 * 登录页状态机。集中管理所有输入字段与 UI 状态。
 */
class LoginViewModel(
    private val preferences: AppPreferences,
    private val authenticateUseCase: AuthenticateUseCase
) : ViewModel() {

    // ===== 输入态 =====
    private val _serverType = MutableStateFlow(ServerType.EMBY)
    val serverType: StateFlow<ServerType> = _serverType.asStateFlow()

    private val _serverUrl = MutableStateFlow("")
    val serverUrl: StateFlow<String> = _serverUrl.asStateFlow()

    private val _username = MutableStateFlow("")
    val username: StateFlow<String> = _username.asStateFlow()

    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password.asStateFlow()

    private val _apiKey = MutableStateFlow("")
    val apiKey: StateFlow<String> = _apiKey.asStateFlow()

    private val _accessToken = MutableStateFlow("")
    val accessToken: StateFlow<String> = _accessToken.asStateFlow()

    // ===== UI 状态 =====
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    // ===== 初始化：检查是否已登录 =====
    init {
        viewModelScope.launch {
            var found: Boolean = false
            preferences.serverConfig.collectLatest { config ->
                if (config != null && !found) {
                    found = true
                    _isLoggedIn.value = true
                    _serverType.value = config.serverType
                    _serverUrl.value = config.url
                    _username.value = config.username
                }
            }
        }
    }

    // ===== UI 输入事件 =====
    fun setServerType(type: ServerType) { _serverType.value = type }
    fun setServerUrl(url: String) { _serverUrl.value = url }
    fun setUsername(value: String) { _username.value = value }
    fun setPassword(value: String) { _password.value = value }
    fun setApiKey(value: String) { _apiKey.value = value }
    fun setAccessToken(value: String) { _accessToken.value = value }

    // ===== 登录 =====
    fun login(onSuccess: () -> Unit) {
        val url = _serverUrl.value.trim().trimEnd('/')
        if (url.isEmpty()) {
            _errorMessage.value = "请输入服务器地址"
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            val result = authenticateUseCase.execute(
                serverType = _serverType.value,
                serverUrl = url,
                username = _username.value,
                password = if (_password.value.isBlank()) null else _password.value,
                apiKey = if (_apiKey.value.isBlank()) null else _apiKey.value,
                accessToken = if (_accessToken.value.isBlank()) null else _accessToken.value
            )

            if (result.isSuccess) {
                _isLoggedIn.value = true
                onSuccess()
            } else {
                _errorMessage.value = result.exceptionOrNull()?.message ?: "登录失败"
            }
            _isLoading.value = false
        }
    }

    // ===== 登出 =====
    fun logout() {
        viewModelScope.launch {
            preferences.clearServerConfig()
            _isLoggedIn.value = false
        }
    }
}
