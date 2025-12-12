#include <emscripten.h>
#include <stdint.h>
#include <string.h>
#include <stdlib.h>   // <-- required for malloc

extern "C" {

// Buffers set by JS
EMSCRIPTEN_KEEPALIVE uint8_t *MAP_DATA = nullptr;
EMSCRIPTEN_KEEPALIVE uint8_t *TAGS_DATA = nullptr;
EMSCRIPTEN_KEEPALIVE uint8_t *INDEX_DATA = nullptr;

EMSCRIPTEN_KEEPALIVE uint32_t MAP_LEN = 0;
EMSCRIPTEN_KEEPALIVE uint32_t TAGS_LEN = 0;
EMSCRIPTEN_KEEPALIVE uint32_t INDEX_LEN = 0;

EMSCRIPTEN_KEEPALIVE
void load_map(uint8_t *ptr, uint32_t len) {
    MAP_DATA = ptr;
    MAP_LEN = len;
}

EMSCRIPTEN_KEEPALIVE
void load_tags(uint8_t *ptr, uint32_t len) {
    TAGS_DATA = ptr;
    TAGS_LEN = len;
}

EMSCRIPTEN_KEEPALIVE
void load_index(uint8_t *ptr, uint32_t len) {
    INDEX_DATA = ptr;
    INDEX_LEN = len;
}

// temp buffer for path lookup + prefix scans
EMSCRIPTEN_KEEPALIVE
uint8_t* temp_ptr() {
    static uint8_t *TMP = nullptr;
    if (!TMP) TMP = (uint8_t*) malloc(4096);
    return TMP;
}

// ---------------------
// PATH LOOKUP
// ---------------------
EMSCRIPTEN_KEEPALIVE
uint32_t lookup_path(uint8_t *ptr, uint32_t len) {
    for (uint32_t i = 0; i < MAP_LEN; ) {

        uint32_t off = *(uint32_t*)(MAP_DATA + i);
        i += 4;

        uint32_t nameLen = *(uint16_t*)(MAP_DATA + i);
        i += 2;

        const char* name = (const char*)(MAP_DATA + i);
        i += nameLen;

        if (nameLen == len && memcmp(name, ptr, len) == 0)
            return off;
    }
    return 0xffffffff;
}

// ---------------------
// PREVIEW BUFFER
// ---------------------
EMSCRIPTEN_KEEPALIVE
uint8_t* preview_ptr() {
    static uint8_t *P = nullptr;
    if (!P) P = (uint8_t*) malloc(4096);
    return P;
}

EMSCRIPTEN_KEEPALIVE
uint32_t read_preview(uint32_t offset, uint32_t maxlen) {
    if (offset + 4 > INDEX_LEN) return 0;

    uint32_t plen = *(uint32_t*)(INDEX_DATA + offset);
    if (plen > maxlen) plen = maxlen;

    uint8_t *out = preview_ptr();
    memcpy(out, INDEX_DATA + offset + 4, plen);

    return plen;
}

// ---------------------
// TAGS: size + mime
// ---------------------
EMSCRIPTEN_KEEPALIVE
uint64_t get_size(uint32_t offset) {
    return *(uint64_t*)(TAGS_DATA + offset);
}

EMSCRIPTEN_KEEPALIVE
char* get_mime(uint32_t offset) {
    return (char*)(TAGS_DATA + offset + 8);
}

// ---------------------
// PREFIX SCAN (simple)
// ---------------------
EMSCRIPTEN_KEEPALIVE
uint32_t prefix_count(uint8_t* ptr, uint32_t len) {
    uint32_t count = 0;

    for (uint32_t i = 0; i < MAP_LEN; ) {

        uint32_t off = *(uint32_t*)(MAP_DATA + i);
        i += 4;

        uint32_t nameLen = *(uint16_t*)(MAP_DATA + i);
        i += 2;

        const char* name = (const char*)(MAP_DATA + i);
        i += nameLen;

        if (nameLen >= len && memcmp(name, ptr, len) == 0)
            count++;
    }

    return count;
}


// prefix output (256 bytes per entry)
EMSCRIPTEN_KEEPALIVE
uint8_t* prefix_ptr() {
    static uint8_t *BUF = nullptr;
    if (!BUF) BUF = (uint8_t*) malloc(603172 * 256);
    return BUF;
}

EMSCRIPTEN_KEEPALIVE
uint32_t list_prefix(uint8_t *ptr, uint32_t len) {
    uint32_t count = 0;
    uint8_t *out = prefix_ptr();

    for (uint32_t i = 0; i < MAP_LEN; ) {

        uint32_t off = *(uint32_t*)(MAP_DATA + i);
        i += 4;

        uint32_t nameLen = *(uint16_t*)(MAP_DATA + i);
        i += 2;

        const char* name = (const char*)(MAP_DATA + i);
        i += nameLen;

        if (nameLen >= len && memcmp(name, ptr, len) == 0) {
            memcpy(out + count*256, name, nameLen);
            out[count*256 + nameLen] = 0;
            count++;
        }
    }

    return count;
}

}
