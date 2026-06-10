plugins {
    alias(libs.plugins.kotlin.multiplatform)
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
                implementation(projects.shared.repository)

                // Coroutines
                implementation(libs.kotlinx.coroutines.core)
            }
        }

        commonTest {
            dependencies {
                implementation(libs.kotlin.test)
                implementation(libs.kotlin.test.junit)
                implementation(libs.mockk)
                implementation(libs.turbine)
            }
        }

        jvmMain {
            dependencies {
                implementation(libs.kotlinx.coroutines.android)
            }
        }
    }
}
