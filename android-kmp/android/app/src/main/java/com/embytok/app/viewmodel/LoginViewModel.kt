package com.embytok.app.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.embytok.domain.model.ServerConfig
import com.embytok.domain.model.ServerType
import com.embytok.usecase.AuthenticateUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
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
 */
class LoginViewModel(
    private val authenticateUseCase: AuthenticateUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()

    fun updateServerType(type: ServerType) {
        _uiState.update { it.copy(serverType = type, error = null) }
    }

    fun updateUrl(url: String) {
        _uiState.update { it.copy(url = url, error = null) }
    }

    fun updateUsername(username: String) {
        _uiState.update { it.copy(username = username, error = null) }
    }

    fun updatePassword(password: String) {
        _uiState.update { it.copy(password = password, error = null) }
    }

    fun updateToken(token: String) {
        _uiState.update { it.copy(token = token, error = null) }
    }

    fun login() {
        val state = _uiState.value

        // 验证输入
        if (state.url.isBlank()) {
            _uiState.update { it.copy(error = "请输入服务器地址") }
            return
        }

        if (state.serverType == ServerType.EMBY) {
            if (state.username.isBlank() || state.password.isBlank()) {
                _uiState.update { it.copy(error = "请输入用户名和密码") }
                return
            }
        } else {
            if (state.token.isBlank()) {
                _uiState.update { it.copy(error = "请输入 Plex Token") }
                return
            }
        }

        _uiState.update { it.copy(isLoading = true, error = null) }

        viewModelScope.launch {
            val result = authenticateUseCase(
                type = state.serverType,
                url = normalizeUrl(state.url),
                username = state.username,
                password = state.password,
                token = state.token
            )

            result.fold(
                onSuccess = { config ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            isLoggedIn = true,
                            error = null
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            error = error.message ?: "登录失败"
                        )
                    }
                }
            )
        }
    }

    fun logout() {
        _uiState.update {
            LoginUiState()
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    /**
     * 规范化 URL（添加 http:// 前缀）
     */
    private fun normalizeUrl(url: String): String {
        return if (url.startsWith("http://") || url.startsWith("https://")) {
            url
        } else {
            "http://$url"
        }
    }
}
