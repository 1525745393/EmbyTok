// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.multiplatform) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.navigation.safeargs) apply false
    alias(libs.plugins.sqldelight) apply false
}

// Configure subprojects
subprojects {
    apply(plugin = "org.jetbrains.kotlin.android")
    apply(plugin = "org.jetbrains.kotlin.plugin.serialization")

    kotlin {
        compilerOptions {
            // Enable free functions to be used in tests
            freeCompilerArgs.add("-Xjsr305=strict")
        }
    }
}
