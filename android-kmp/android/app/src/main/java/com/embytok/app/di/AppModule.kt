package com.embytok.app.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.embytok.app.viewmodel.LoginViewModel
import com.embytok.app.viewmodel.FeedViewModel
import com.embytok.app.viewmodel.SettingsViewModel
import com.embytok.app.viewmodel.SearchViewModel
import com.embytok.common.EmbyTokLogger
import com.embytok.domain.client.MediaClient
import com.embytok.domain.model.ServerConfig
import com.embytok.network.ClientFactory
import com.embytok.usecase.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.koin.android.ext.koin.androidContext
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

// DataStore 扩展
private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "embytok_preferences")

/**
 * 应用模块
 */
val appModule = org.koin.dsl.module {
    // ============ DataStore ============
    single { androidContext().dataStore }

    // ============ 状态管理 ============
    // 当前服务器配置
    single {
        val dataStore: DataStore<Preferences> = get()
        val preferences = MutableStateFlow<ServerConfig?>(null)
        PreferencesManager(dataStore, preferences)
    }

    // 当前 MediaClient
    single {
        val config: ServerConfig? = get<PreferencesManager>().getCurrentConfig()
        if (config != null) {
            ClientFactory.create(config)
        } else {
            null
        }
    }

    // ============ UseCases ============
    factory {
        AuthenticateUseCase { type, url, username, password, token ->
            ClientFactory.authenticate(type, url, username, password, token)
        }
    }

    factory {
        GetLibrariesUseCase {
            get<MediaClient?>() ?: throw IllegalStateException("Not logged in")
        }
    }

    factory {
        GetVideosUseCase {
            get<MediaClient?>() ?: throw IllegalStateException("Not logged in")
        }
    }

    factory {
        GetResumeItemsUseCase {
            get<MediaClient?>() ?: throw IllegalStateException("Not logged in")
        }
    }

    factory {
        GetVideoUrlUseCase {
            get<MediaClient?>() ?: throw IllegalStateException("Not logged in")
        }
    }

    factory {
        ToggleFavoriteUseCase {
            get<MediaClient?>() ?: throw IllegalStateException("Not logged in")
        }
    }

    factory {
        SearchItemsUseCase {
            get<MediaClient?>() ?: throw IllegalStateException("Not logged in")
        }
    }

    factory {
        GetSubtitleTracksUseCase {
            get<MediaClient?>() ?: throw IllegalStateException("Not logged in")
        }
    }

    factory {
        GetFavoritesUseCase {
            get<MediaClient?>() ?: throw IllegalStateException("Not logged in")
        }
    }

    // ============ ViewModels ============
    viewModel { LoginViewModel(get()) }
    viewModel { FeedViewModel(get(), get(), get(), get(), get()) }
    viewModel { SettingsViewModel(get()) }
    viewModel { SearchViewModel(get()) }
}

/**
 * 偏好设置管理器
 */
class PreferencesManager(
    private val dataStore: DataStore<Preferences>,
    private val configFlow: MutableStateFlow<ServerConfig?>
) {
    private val logger = EmbyTokLogger

    suspend fun saveConfig(config: ServerConfig) {
        logger.d("保存服务器配置", "PreferencesManager")
        configFlow.value = config
        // TODO: 使用 DataStore 持久化
    }

    suspend fun clearConfig() {
        logger.d("清除服务器配置", "PreferencesManager")
        configFlow.value = null
    }

    fun getCurrentConfig(): ServerConfig? = configFlow.value
}
