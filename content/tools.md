@@ cpp-style
# Стиль кода
> Соглашения учебного проекта и читаемые примеры на C++.

## Имена и форматирование

В исходных материалах использован стиль с `snake_case` для переменных, `PascalCase` для типов и функций, `kPascalCase` для именованных констант. Например, `edge_count`, `FindPath()` и `kMaxVertices`. Для аббревиатур встречается запись `GetItmoYear()`. Если в задании есть свой гайд или конфигурация форматтера, следуйте им.

Открывающая скобка идёт в той же строке. В этих соглашениях ориентир для длины строки — 80 символов. Используйте единообразные имена файлов, например `graph_search.cpp` и `graph_search.hpp`. Расширения заголовков выбирают по соглашению проекта.

## Что делает код яснее

- Описывайте действие глаголом: `FindMaxIndex`, `PrintMessage`. Данные обычно обозначают существительным: `index`, `message`.
- Пишите `std::vector` и `std::cout` явно, особенно в заголовках. Для средств из C-библиотеки в C++ обычно используют `<cmath>`, `<cstdio>` и `<cstring>`.
- Выбирайте `enum class` для вариантов вроде `ParseError::kInvalidInput`. Применяйте уникальные include guards в заголовках, если этого требует гайд.

[Учебный гайд по стилю C++](https://github.com/is-itmo-c-25/cpp-coding-guidelines)

@@ cpp-cmake
# Сборка с CMake
> Описание целей, выбор стандарта и команды сборки.

## Минимальный CMakeLists.txt

CMake читает описание проекта и настраивает выбранную систему сборки. Цель `calc` собирается из двух файлов. Требование C++20 задаётся для конкретной цели через `target_compile_features`.

```cmake
cmake_minimum_required(VERSION 3.16)
project(Calc LANGUAGES CXX)

add_executable(calc main.cpp calculator.cpp)
target_compile_features(calc PRIVATE cxx_std_20)
```

```sh
cmake -S . -B build
cmake --build build
```

`-S` задаёт путь к исходникам, `-B` — каталог сборки. Если программа и тесты используют одну реализацию, вынесите её в библиотеку через `add_library` и подключите к обеим целям через `target_link_libraries`. Смотрите [официальное руководство CMake](https://cmake.org/cmake/help/latest/guide/tutorial/index.html).

@@ cpp-gtest
# Тесты с GoogleTest
> Тест-кейсы, EXPECT и ASSERT, запуск через CTest.

## Пример модульного теста

```cpp
#include <gtest/gtest.h>
#include "calculator.hpp"

TEST(Add, HandlesZeroAndSignedValues) {
    EXPECT_EQ(5, Add(2, 3));
    EXPECT_EQ(0, Add(0, 0));
    EXPECT_EQ(-1, Add(2, -3));
}
```

В `TEST` первый аргумент именует набор, второй — конкретный тест. `EXPECT_EQ` отмечает ошибку и продолжает текущий тест. `ASSERT_EQ` завершает текущую функцию при ошибке. Используйте фатальную проверку, если дальнейшие операции имеют смысл только при выполнении условия.

## Подключение к CMake

Пример предполагает установленный GoogleTest и цель библиотеки `calc_lib`. Вынесите `calculator.cpp` в отдельную цель и подключите её к программе и тестам.

```cmake
# Цель calc из предыдущей главы теперь содержит только main.cpp.
add_library(calc_lib calculator.cpp)
target_compile_features(calc_lib PUBLIC cxx_std_20)
target_include_directories(calc_lib PUBLIC "${CMAKE_CURRENT_SOURCE_DIR}")
target_link_libraries(calc PRIVATE calc_lib)

enable_testing()
find_package(GTest REQUIRED)
add_executable(calc_tests calculator_test.cpp)
target_link_libraries(calc_tests PRIVATE calc_lib GTest::gtest_main)
include(GoogleTest)
gtest_discover_tests(calc_tests)
```

```sh
cmake --build build
ctest --test-dir build --output-on-failure
```

Добавляйте обычные значения, границы и ошибки, описанные контрактом функции. При подключении GoogleTest как Git-подмодуля клонируйте проект с `--recurse-submodules` и добавляйте зависимость через `add_subdirectory` вместо `find_package`. Подробности в [GoogleTest Primer](https://google.github.io/googletest/primer.html).
