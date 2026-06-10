pluginManagement {
    val kotlinVersion = "1.9.24"
    val sqlDelightVersion = "2.0.2"
    val agpVersion = "8.5.0"

    repositories {
        google()
        gradlePluginPortal()
        mavenCentral()
    }

    plugins {
        // Android Gradle Plugin
        id("com.android.application") version agpVersion apply false
        id("com.android.library") version agpVersion apply false
        // Kotlin
        id("org.jetbrains.kotlin.android") version kotlinVersion apply false
        id("org.jetbrains.kotlin.multiplatform") version kotlinVersion apply false
        id("org.jetbrains.kotlin.plugin.serialization") version kotlinVersion apply false
        id("org.jetbrains.kotlin.plugin.compose") version kotlinVersion apply false
        // SQLDelight
        id("app.cash.sqldelight") version sqlDelightVersion apply false
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // Koin / Ktor 的快照仓库（如需要）
        maven { url = uri("https://oss.sonatype.org/content/repositories/snapshots/") }
    }
}

rootProject.name = "EmbyTokKMP"

include(":shared:common")
include(":shared:domain")
include(":shared:network")
include(":shared:repository")
include(":shared:usecase")
include(":android:app")
include(":android:player")
