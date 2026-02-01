import { Canvas, MindMap, Node, Markdown } from '@graphwrite/core';

/**
 * MindMap Markdown Example
 * 
 * Demonstrates Code Blocks with Long Content (Trie Algorithm)
 */
export default function MindMapMarkdownExample() {
    return (
        <Canvas>
            <MindMap x={50} y={50} layout="tree" spacing={150}>

                {/* Root Node */}
                <Node id="root" className="bg-white p-6 w-[350px]">
                    <Markdown>
                        {`# Code Block Test
                        
Testing long code blocks with **Trie (Prefix Tree)** implementations in 5 languages.

Check for:
- Syntax Highlighting
- Horizontal Scrolling
- Vertical Height
- Copy Functionality`}
                    </Markdown>
                </Node>

                {/* TypeScript Example */}
                <Node id="ts" from="root" className="bg-white p-2 w-[600px]">
                    <Markdown>
                        {`### TypeScript
\`\`\`typescript
class TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;

    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
    }
}

class Trie {
    private root: TrieNode;

    constructor() {
        this.root = new TrieNode();
    }

    // Inserts a word into the trie.
    insert(word: string): void {
        let current = this.root;
        for (const char of word) {
            if (!current.children.has(char)) {
                current.children.set(char, new TrieNode());
            }
            current = current.children.get(char)!;
        }
        current.isEndOfWord = true;
    }

    // Returns true if the word is in the trie.
    search(word: string): boolean {
        let current = this.root;
        for (const char of word) {
            if (!current.children.has(char)) {
                return false;
            }
            current = current.children.get(char)!;
        }
        return current.isEndOfWord;
    }

    // Returns true if there is any word in the trie that starts with the given prefix.
    startsWith(prefix: string): boolean {
        let current = this.root;
        for (const char of prefix) {
            if (!current.children.has(char)) {
                return false;
            }
            current = current.children.get(char)!;
        }
        return true;
    }
}
\`\`\``}
                    </Markdown>
                </Node>

                {/* Go Example */}
                <Node id="go" from="root" className="bg-white p-2 w-[600px]">
                    <Markdown>
                        {`### Go (Golang)
\`\`\`go
package main

import "fmt"

type TrieNode struct {
    children map[rune]*TrieNode
    isEnd    bool
}

type Trie struct {
    root *TrieNode
}

func Constructor() Trie {
    return Trie{root: &TrieNode{children: make(map[rune]*TrieNode)}}
}

func (this *Trie) Insert(word string) {
    node := this.root
    for _, char := range word {
        if _, exists := node.children[char]; !exists {
            node.children[char] = &TrieNode{children: make(map[rune]*TrieNode)}
        }
        node = node.children[char]
    }
    node.isEnd = true
}

func (this *Trie) Search(word string) bool {
    node := this.root
    for _, char := range word {
        if _, exists := node.children[char]; !exists {
            return false
        }
        node = node.children[char]
    }
    return node.isEnd
}

func (this *Trie) StartsWith(prefix string) bool {
    node := this.root
    for _, char := range prefix {
        if _, exists := node.children[char]; !exists {
            return false
        }
        node = node.children[char]
    }
    return true
}
\`\`\``}
                    </Markdown>
                </Node>

                {/* Python Example */}
                <Node id="python" from="root" className="bg-white p-2 w-[600px]">
                    <Markdown>
                        {`### Python
\`\`\`python
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True

    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end_of_word

    def startsWith(self, prefix: str) -> bool:
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True
\`\`\``}
                    </Markdown>
                </Node>

                {/* Java Example */}
                <Node id="java" from="root" className="bg-white p-2 w-[600px]">
                    <Markdown>
                        {`### Java
\`\`\`java
class TrieNode {
    private TrieNode[] links;
    private final int R = 26;
    private boolean isEnd;

    public TrieNode() {
        links = new TrieNode[R];
    }

    public boolean containsKey(char ch) {
        return links[ch - 'a'] != null;
    }

    public TrieNode get(char ch) {
        return links[ch - 'a'];
    }

    public void put(char ch, TrieNode node) {
        links[ch - 'a'] = node;
    }

    public void setEnd() {
        isEnd = true;
    }

    public boolean isEnd() {
        return isEnd;
    }
}

class Trie {
    private TrieNode root;

    public Trie() {
        root = new TrieNode();
    }

    public void insert(String word) {
        TrieNode node = root;
        for (int i = 0; i < word.length(); i++) {
            char currentChar = word.charAt(i);
            if (!node.containsKey(currentChar)) {
                node.put(currentChar, new TrieNode());
            }
            node = node.get(currentChar);
        }
        node.setEnd();
    }
}
\`\`\``}
                    </Markdown>
                </Node>

                {/* C++ Example */}
                <Node id="cpp" from="root" className="bg-white p-2 w-[600px]">
                    <Markdown>
                        {`### C++
\`\`\`cpp
#include <iostream>
#include <vector>
using namespace std;

struct TrieNode {
    struct TrieNode *children[26];
    bool isEndOfWord;
};

struct TrieNode *getNode(void) {
    struct TrieNode *pNode = new TrieNode;
    pNode->isEndOfWord = false;
    for (int i = 0; i < 26; i++)
        pNode->children[i] = NULL;
    return pNode;
}

void insert(struct TrieNode *root, string key) {
    struct TrieNode *pCrawl = root;
    for (int i = 0; i < key.length(); i++) {
        int index = key[i] - 'a';
        if (!pCrawl->children[index])
            pCrawl->children[index] = getNode();
        pCrawl = pCrawl->children[index];
    }
    pCrawl->isEndOfWord = true;
}

bool search(struct TrieNode *root, string key) {
    struct TrieNode *pCrawl = root;
    for (int i = 0; i < key.length(); i++) {
        int index = key[i] - 'a';
        if (!pCrawl->children[index])
            return false;
        pCrawl = pCrawl->children[index];
    }
    return (pCrawl != NULL && pCrawl->isEndOfWord);
}
\`\`\``}
                    </Markdown>
                </Node>

            </MindMap>
        </Canvas>
    );
}
