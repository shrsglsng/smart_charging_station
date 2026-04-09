# Smart Charging Station - Firmware

This is an Arduino-based charging station project managed with [PlatformIO](https://platformio.org/).

## Project Structure

- `src/`: Source code files.
  - `matrix.cpp`: Implementation for the keypad matrix scanning.
  - `single_port.cpp`: Implementation for a single port charging logic with door sensor and lock.
- `platformio.ini`: Project configuration file.

## How to Build and Upload

This project uses PlatformIO. You can use it via the VS Code extension or the CLI.

### 1. Install PlatformIO
If you haven't already, install the [PlatformIO IDE extension](https://marketplace.visualstudio.com/items?itemName=platformio.platformio-ide) for VS Code.

### 2. Choose an Environment
The project has two main environments defined in `platformio.ini`:
- `matrix`: Builds the keypad matrix scanning program.
- `single_port`: Builds the single port charging logic.

### 3. Build/Upload
- **In VS Code**: Click the PlatformIO icon on the left sidebar, select your desired environment (`matrix` or `single_port`), and click **Build** or **Upload**.
- **In CLI**:
  ```bash
  # To build the matrix environment
  pio run -e matrix

  # To upload the matrix environment
  pio run -e matrix --target upload

  # To build the single_port environment
  pio run -e single_port

  # To upload the single_port environment
  pio run -e single_port --target upload
  ```

## Hardware
- **Board**: Arduino Mega 2560
- **Framework**: Arduino

