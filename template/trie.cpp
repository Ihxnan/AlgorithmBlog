#include "../template.cpp"

class Trie
{
    int n;
    int cnt;
    vi pass;
    vi end;
    vvi tree;

    int getNum(const char &x)
    {
        return x - 'a';
    }

  public:
    Trie(int n) : n(n), cnt(0), pass(n), end(n), tree(n, vi(26))
    {
    }

    void insert(const string &str)
    {
        int cur = 0;
        ++pass[cur];
        for (auto &ch : str)
        {
            int x = getNum(ch);
            if (!tree[cur][x])
                tree[cur][x] = ++cnt;
            cur = tree[cur][x];
            ++pass[cur];
        }
        ++end[cur];
    }

    int search(const string &str)
    {
        int cur = 0;
        for (auto &ch : str)
        {
            int x = getNum(ch);
            if (!tree[cur][x])
                return 0;
            cur = tree[cur][x];
        }
        return end[cur];
    }

    int prefix(const string &str)
    {
        int cur = 0;
        for (auto &ch : str)
        {
            int x = getNum(ch);
            if (!tree[cur][x])
                return 0;
            cur = tree[cur][x];
        }
        return pass[cur];
    }

    void del(const string &str)
    {
        if (!search(str))
            return;
        int cur = 0;
        --pass[cur];
        for (auto &ch : str)
        {
            int x = getNum(ch);
            if(--pass[tree[cur][x]] == 0)
            {
                tree[cur][x] = 0;
                return;
            }
            cur = tree[cur][x];
        }
        --end[cur];
    }

    void clear()
    {
        for (int i = 0; i <= cnt; ++i)
        {
            fill(all(tree[i]), 0);
            end[i] = 0;
            pass[i] = 0;
        }
        cnt = 0;
    }
};
