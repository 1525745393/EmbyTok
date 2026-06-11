plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
    alias(libs.plugins.navigation.safeargs)
    alias(libs.plugins.kotlin.serialization)
}

android {
    namespace = "com.embytok.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.embytok.app.compose"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
            isDebuggable = true
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.14"
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    sourceSets {
        getByName("main") {
            java.srcDirs("src/main/java", "src/main/kotlin")
        }
        getByName("androidTest") {
            java.srcDirs("src/androidTest/java", "src/androidTest/kotlin")
        }
    }
}

dependencies {
    // AndroidX Core
    implementation(libs.androidx.core)
    implementation(libs.androidx.activity)
    implementation(libs.bundles.androidx.lifecycle)

    // Compose
    implementation(platform(libs.compose.bom))
    implementation(libs.bundles.compose)
    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.tooling.preview)
    androidTestImplementation(libs.androidx.compose.ui.test)

    // Navigation
    implementation(libs.navigation.compose)

    // Coil for image loading
    implementation(libs.coil.compose)

    // DataStore
    implementation(libs.androidx.datastore)

    // Koin DI
    implementation(libs.koin.android)
    implementation(libs.koin.androidx.viewmodel)

    // Media3 (媒体会话 & 播放控制)
    implementation(libs.media3.session)
    implementation(libs.media3.exoplayer)
    implementation(libs.media3.common)
    implementation(libs.media3.ui)

    // Player module
    implementation(projects.android.player)

    // Shared modules
    implementation(projects.shared.common)
    implementation(projects.shared.domain)
    implementation(projects.shared.network)
    implementation(projects.shared.repository)
    implementation(projects.shared.usecase)

    // Coroutines
    implementation(libs.bundles.coroutines)

    // Testing
    testImplementation(libs.kotlin.test)
    testImplementation(libs.kotlin.test.junit)
    testImplementation(libs.junit)
    testImplementation(libs.mockk)
    testImplementation(libs.turbine)
    androidTestImplementation(libs.robolectric)
}
