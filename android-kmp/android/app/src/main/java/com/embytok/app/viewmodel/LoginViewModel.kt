package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.preferences.AppPreferences
import com.embytok.domain.model.ServerType
import com.embytok.usecase.AuthenticateUseCase
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

/**
 * 登录页 ViewModel
 *
 * 状态：
 *  - 输入框：serverUrl / username / password / apiKey / accessToken
 *  - serverType（Emby / Plex）
 *  - isLoggedIn
 *  - 登录状态
 *
 * 行为：
 *  - 调用 [AuthenticateUseCase]
 *  - 将配置保存到 [AppPreferences]
 */
@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModel(
    private val preferences: AppPreferences,
    private val loginUseCase: AuthenticateUseCase
) : ViewModel() {

    // ====== UI 输入状态 ======
    private val _serverUrl = MutableStateFlow("")
    private val _username = MutableStateFlow("")
    private val _password = MutableStateFlow("")
    private val _apiKey = MutableStateFlow("")
    private val _accessToken = MutableStateFlow("")
    private val _serverType = MutableStateFlow(ServerType.EMBY)

    // ====== 登录状态 ======
    private val _isLoggedIn = MutableStateFlow(false)
    private val _isLoading = MutableStateFlow(false)
    private val _errorMessage = MutableStateFlow<String?>(null)

    data class UiState(
        val serverUrl: String,
        val username: String,
        val password: String,
        val apiKey: String,
        val accessToken: String,
        val serverType: ServerType,
        val isLoggedIn: Boolean,
        val isLoading: Boolean,
        val errorMessage: String?
    )

    val uiState: StateFlow<UiState> = combine(
        _serverUrl,
        _username,
        _password,
        _apiKey,
        _accessToken,
        _serverType,
        _isLoggedIn,
        _isLoading,
        _errorMessage
    ) { a1, a2, a3, a4, a5, a6, a7, a8, a9 ->
        UiState(a1, a2, a3, a4, a5, a6, a7, a8, a9)
    }.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5_000),
        initialValue = UiState(
            serverUrl = "",
            username = "",
            password = "",
            apiKey = "",
            accessToken = "",
            serverType = ServerType.EMBY,
            isLoggedIn = false,
            isLoading = false,
            errorMessage = null
        )
    )

    // ====== 初始化：从 preferences 读取已保存配置 ======
    init {
        viewModelScope.launch {
            preferences.serverConfig.collect { config ->
                config?.let {
                    _serverUrl.value = it.serverUrl
                    _username.value = it.username
                    _apiKey.value = it.apiKey.orEmpty()
                    _accessToken.value = it.accessToken.orEmpty()
                    _serverType.value = it.serverType
                }
            }
        }
    }

    // ====== 输入绑定 ======
    fun setServerUrl(value: String) { _serverUrl.value = value }
    fun setUsername(value: String) { _username.value = value }
    fun setPassword(value: String) { _password.value = value }
    fun setApiKey(value: String) { _apiKey.value = value }
    fun setAccessToken(value: String) { _accessToken.value = value }
    fun setServerType(value: ServerType) { _serverType.value = value }

    // ====== 登录 ======
    fun login(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                val result = loginUseCase.execute(
                    serverType = _serverType.value,
                    serverUrl = _serverUrl.value,
                    username = _username.value,
                    password = _password.value,
                    apiKey = if (_apiKey.value.isBlank()) null else _apiKey.value,
                    accessToken = if (_accessToken.value.isBlank()) null else _accessToken.value
                )
                if (result.isSuccess) {
                    _isLoggedIn.value = true
                    onSuccess()
                } else {
                    _errorMessage.value = "登录失败：${result.exceptionOrNull()?.message}"
                }
            } catch (e: Exception) {
                _errorMessage.value = "登录失败：${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * 退出登录：清空 DataStore 中的 serverConfig。
     */
    fun logout() {
        viewModelScope.launch {
            preferences.clearServerConfig()
            _isLoggedIn.value = false
        }
    }
}
