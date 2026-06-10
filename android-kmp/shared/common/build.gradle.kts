import org.jetbrains.kotlin.gradle.dsl.KotlinMultiplatformExtension

plugins {
    id("org.jetbrains.kotlin.multiplatform")
}

kotlin {
    // 支持 JVM（Android + 桌面）
    jvm()

    // 支持 JS（未来 Web 版本）
    js(IR) {
        browser()
    }

    // 公共源集
    sourceSets {
        val commonMain by getting {
            dependencies {
                // Kotlin 基础
                implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.24")
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.0")

                // 日志
                implementation("co.touchlab:kermit:2.0.2")

                // DI
                implementation("io.insert-koin:koin-core:3.5.6")
            }
        }

        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
                implementation(kotlin("test-junit"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
            }
        }

        val jvmMain by getting {
            dependencies {
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
            }
        }
    }
}
