package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.ui.di.ServiceLocator
import com.embytok.domain.model.ServerType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * 登录页 ViewModel
 */
class LoginViewModel : ViewModel() {

    private val authUseCase = ServiceLocator.authenticateUseCase

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

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    init {
        viewModelScope.launch {
            val config = authUseCase.currentConfig()
            if (config != null) {
                _isLoggedIn.value = true
                _serverType.value = config.serverType
                _serverUrl.value = config.url
                _username.value = config.username
            }
        }
    }

    fun setServerType(type: ServerType) { _serverType.value = type }
    fun setServerUrl(url: String) { _serverUrl.value = url }
    fun setUsername(value: String) { _username.value = value }
    fun setPassword(value: String) { _password.value = value }
    fun setApiKey(value: String) { _apiKey.value = value }
    fun setAccessToken(value: String) { _accessToken.value = value }

    fun login(onSuccess: () -> Unit) {
        val url = _serverUrl.value.trim().trimEnd('/')
        if (url.isEmpty()) {
            _errorMessage.value = "请输入服务器地址"
            return
        }
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            val result = authUseCase.execute(
                serverType = _serverType.value,
                serverUrl = url,
                username = _username.value,
                password = _password.value.ifBlank { null },
                apiKey = _apiKey.value.ifBlank { null },
                accessToken = _accessToken.value.ifBlank { null }
            )
            if (result.isSuccess) {
                _isLoggedIn.value = true
                onSuccess()
            } else {
                _errorMessage.value = result.exceptionOrNull()?.message ?: "登录失败，请检查服务器地址与凭据"
            }
            _isLoading.value = false
        }
    }

    fun logout() {
        viewModelScope.launch {
            authUseCase.logout()
            _isLoggedIn.value = false
        }
    }
}
