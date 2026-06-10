pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
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

// Enable Gradle build cache
enableBuildCache()
