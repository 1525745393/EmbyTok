package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.app.preferences.AppPreferences
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType
import com.embytok.network.ClientFactory
import com.embytok.usecase.AuthenticateUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * 登录 UI 状态
 */
data class LoginUiState(
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val error: String? = null,
    val serverType: ServerType = ServerType.EMBY,
    val url: String = "",
    val username: String = "",
    val password: String = "",
    val token: String = ""
)

/**
 * 登录 ViewModel
 *
 * 负责：
 * - 收集用户输入
 * - 调用 [AuthenticateUseCase] 进行认证
 * - 将 [ServerConfig] 保存到 DataStore
 * - 登出时清除 DataStore
 */
class LoginViewModel(
    private val authenticateUseCase: AuthenticateUseCase,
    private val preferences: AppPreferences
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    // 启动时读取 DataStore 判断是否已登录
    init {
        val savedConfig = preferences.getServerConfig()
        if (savedConfig != null) {
            _uiState.value = _uiState.value.copy(
                isLoggedIn = true,
                serverType = savedConfig.serverType,
                url = savedConfig.url,
                username = savedConfig.username,
                token = savedConfig.token
            )
        }
    }

    fun updateServerType(type: ServerType) {
        _uiState.value = _uiState.value.copy(serverType = type, error = null)
    }

    fun updateUrl(url: String) {
        _uiState.value = _uiState.value.copy(url = url, error = null)
    }

    fun updateUsername(username: String) {
        _uiState.value = _uiState.value.copy(username = username, error = null)
    }

    fun updatePassword(password: String) {
        _uiState.value = _uiState.value.copy(password = password, error = null)
    }

    fun updateToken(token: String) {
        _uiState.value = _uiState.value.copy(token = token, error = null)
    }

    /**
     * 提交登录
     */
    fun login() {
        val state = _uiState.value

        if (state.url.isBlank()) {
            _uiState.value = _uiState.value.copy(error = "请输入服务器地址")
            return
        }

        // 根据服务器类型验证输入
        when (state.serverType) {
            ServerType.EMBY -> {
                if (state.username.isBlank() || state.password.isBlank()) {
                    _uiState.value = _uiState.value.copy(error = "请输入用户名和密码")
                    return
                }
            }
            ServerType.PLEX -> {
                if (state.token.isBlank()) {
                    _uiState.value = _uiState.value.copy(error = "请输入 Plex Token")
                    return
                }
            }
        }

        _uiState.value = _uiState.value.copy(isLoading = true, error = null)

        viewModelScope.launch {
            val result = runCatching {
                authenticateUseCase(
                    type = state.serverType,
                    url = normalizeUrl(state.url),
                    username = state.username,
                    password = state.password,
                    token = state.token
                )
            }

            result.fold(
                onSuccess = { config ->
                    // 保存到 DataStore
                    preferences.saveServerConfig(config)

                    // 重新初始化 MediaClient（直接调用工厂方法）
                    ClientFactory.fromConfig(config)

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        error = null,
                        token = config.token,
                        username = config.username
                    )
                },
                onFailure = { error ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = error.message ?: "登录失败"
                    )
                }
            )
        }
    }

    /**
     * 登出：清除配置和缓存
     */
    fun logout() {
        viewModelScope.launch {
            preferences.clearServerConfig()
            com.embytok.network.ClientFactory.clearCache()
            _uiState.value = LoginUiState()
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }

    /**
     * 规范化 URL：添加 http:// 前缀
     */
    private fun normalizeUrl(url: String): String {
        val trimmed = url.trim()
        return when {
            trimmed.startsWith("http://") || trimmed.startsWith("https://") -> trimmed
            // 本地开发常见：192.168.x.x 或 localhost
            trimmed.startsWith("localhost") || trimmed.matches(Regex("^\\d+\\.\\d+\\.\\d+\\.\\d+.*")) -> "http://$trimmed"
            else -> "https://$trimmed"
        }
    }
}
