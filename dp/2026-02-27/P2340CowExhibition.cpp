// https://www.luogu.com.cn/problem/P1544
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    vector<pii> arr;

    for (int i = 0, a, b; i < n; ++i)
    {
        cin >> a >> b;
        if (a > 0 || b > 0)
            arr.emplace_back(a, b);
    }

    map<ti, int> memo;
    auto dfs = [&](auto &&self, int pos, int s1, int s2) -> int {
        if (memo.count({pos, s1, s2}))
            return memo[{pos, s1, s2}];
        if (pos == arr.size())
        {
            if (s1 >= 0 && s2 >= 0)
                return memo[{pos, s1, s2}] = s1 + s2;
            return memo[{pos, s1, s2}] = 0;
        }
        return memo[{pos, s1, s2}] =
                   max(self(self, pos + 1, s1 + arr[pos].first, s2 + arr[pos].second), self(self, pos + 1, s1, s2));
    };
    cout << dfs(dfs, 0, 0, 0) << endl;
}
