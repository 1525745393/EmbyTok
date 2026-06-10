plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.ksp)
    alias(libs.plugins.sqldelight)
}

sqldelight {
    database("EmbyTokDatabase") {
        packageName.set("com.embytok.db")
        sourceFolders.set(listOf("src/commonMain/sqldelight"))
    }
}

kotlin {
    jvm()
    js(IR) {
        browser()
    }

    sourceSets {
        commonMain {
            dependencies {
                implementation(projects.shared.common)
                implementation(projects.shared.domain)
                implementation(projects.shared.network)

                // Coroutines
                implementation(libs.kotlinx.coroutines.core)

                // SQLDelight
                implementation(libs.sqldelight.coroutines)
            }
        }

        commonTest {
            dependencies {
                implementation(libs.kotlin.test)
                implementation(libs.kotlin.test.junit)
                implementation(libs.mockk)
                implementation(libs.turbine)

                // SQLDelight for testing (in-memory)
                implementation(libs.sqldelight.android)
            }
        }

        jvmMain {
            dependencies {
                implementation(libs.kotlinx.coroutines.android)
                implementation(libs.sqldelight.android)
            }
        }
    }
}
