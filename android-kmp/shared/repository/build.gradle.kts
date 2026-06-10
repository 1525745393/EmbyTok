import org.jetbrains.kotlin.gradle.dsl.KotlinMultiplatformExtension

plugins {
    id("org.jetbrains.kotlin.multiplatform")
    id("app.cash.sqldelight")
    id("org.jetbrains.kotlin.plugin.serialization")
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
                // 依赖其他 shared 模块
                implementation(projects.shared.common)
                implementation(projects.shared.domain)

                // Kotlin 基础
                implementation("org.jetbrains.kotlin:kotlin-stdlib:1.9.24")
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
                implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")
                implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.6.0")

                // SQLDelight 核心库（多平台）
                implementation("app.cash.sqldelight:runtime:2.0.2")
                implementation("app.cash.sqldelight:coroutines-extensions:2.0.2")
                implementation("app.cash.sqldelight:primitive-adapters:2.0.2")

                // DI
                implementation("io.insert-koin:koin-core:3.5.6")

                // Log
                implementation("co.touchlab:kermit:2.0.2")
            }
        }

        val commonTest by getting {
            dependencies {
                implementation(kotlin("test"))
                implementation(kotlin("test-junit"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
                // SQLDelight 测试（JVM 内存驱动）
                implementation("app.cash.sqldelight:sqlite-driver:2.0.2")
            }
        }

        // JVM 目标（Android/桌面）
        val jvmMain by getting {
            dependsOn(commonMain)
            dependencies {
                // Android SQLite 驱动
                implementation("app.cash.sqldelight:android-driver:2.0.2")
            }
        }
    }
}

// SQLDelight 配置
sqldelight {
    databases {
        create("EmbyTokDatabase") {
            packageName.set("com.embytok.db")
            sourceFolders.set(listOf("sqldelight"))
            // 异步 driver 支持 coroutines
            generateAsync.set(true)
        }
    }
}
