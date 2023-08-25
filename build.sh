#!/bin/bash

# These arrays will hold the symlink info
SYMLINKS_PATHS=()
SYMLINKS_TARGETS=()
PACKAGES=("ui")
# List of valid platforms and architectures. You can expand this as needed.
VALID_PLATFORMS=("darwin" "linux")
VALID_ARCHS=("x64" "arm64")

# Parse the arguments into platform and arch arrays.
TARGET_PLATFORMS=()
ARG_ARCHS=()

# Check if a value exists in an array.
# Usage: exists_in_array value "${array[@]}"
exists_in_array() {
    local value="$1"
    shift
    for i in "$@"; do
        [[ "$i" == "$value" ]] && return 0
    done
    return 1
}

for arg in "$@"; do
    if exists_in_array "$arg" "${VALID_PLATFORMS[@]}"; then
        TARGET_PLATFORMS+=("$arg")
    elif exists_in_array "$arg" "${VALID_ARCHS[@]}"; then
        ARG_ARCHS+=("$arg")
    else
        echo "Invalid argument: $arg"
        exit 1
    fi
done

npm install

# Navigate to node_modules
cd node_modules || exit

# Find all symlinks in the current directory
for symlink in "${PACKAGES[@]}"; do
    # Resolve the actual path of the symlink
    real_path=$(readlink -f $symlink)
    
    # Store the symlink info
    SYMLINKS_PATHS+=("$symlink")
    SYMLINKS_TARGETS+=("$real_path")

    # Remove the symlink
    rm -rf $symlink

    # Copy the actual content to node_modules
    cp -R $real_path $symlink
done

# Return to the original directory and run parcel build
cd ..
npx parcel build --public-url .
npm run build:sidecars; echo "Finished building sidecars"

echo "Building for platforms: ${TARGET_PLATFORMS[*]}"
echo "Building for architectures: ${TARGET_ARCHS[*]}"

for platform in "${TARGET_PLATFORMS[@]}"; do
    local_archs=("${ARG_ARCHS[@]}")

    # If "darwin" is selected and no archs are specified, default to both x64 and arm64.
    if [[ "$platform" == "darwin" && ${#local_archs[@]} -eq 0 ]]; then
        local_archs=("x64" "arm64")
    fi

    if [[ ${#local_archs[@]} -eq 0 ]]; then
        echo "Building for $platform..."
        npm run make -- --platform="$platform"
    else
        for arch in "${local_archs[@]}"; do
            echo "Building for $platform $arch..."
            npm run make -- --platform="$platform" --arch="$arch"
        done
    fi
done

echo "Finished building for platforms: ${TARGET_PLATFORMS[*]}"

# Navigate back to node_modules to revert symlinks
cd node_modules || exit

# Restore the symlinks
for index in "${!SYMLINKS_PATHS[@]}"; do
    symlink="${SYMLINKS_PATHS[$index]}"
    real_path="${SYMLINKS_TARGETS[$index]}"

    # Delete the copied directory
    rm -rf $symlink

    # Recreate the symlink
    ln -s $real_path $symlink
done

# Return to the original directory
cd ..
