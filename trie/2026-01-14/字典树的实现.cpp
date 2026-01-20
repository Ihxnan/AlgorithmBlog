// https://www.nowcoder.com/practice/7f8a8553ddbf4eaab749ec988726702b
#include "../../template/trie.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int m;
    cin >> m;
    int op;
    Trie trie(200000);
    string str;
    for (int i = 0; i < m; ++i)
    {
        cin >> op >> str;
        if (op == 1)
            trie.insert(str);
        else if (op == 2)
            trie.del(str);
        else if (op == 3)
            YN(trie.search(str));
        else
            cout << trie.prefix(str) << endl;
    }
}
