// https://www.luogu.com.cn/problem/P2285
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n, m;
    cin >> n >> m;
    vector<tuple<int, int, int>> arr(m);
    for (auto &[time, x, y] : arr)
        cin >> time >> x >> y;
    sort(all(arr));
    auto dfs = [&](auto &&self, int num, int time) -> int
    {
        if (num == n)
            return 0;
        int ans = self(self, num + 1, time);
        if (!num || get<0>(arr[num]) - time >= abs(get<1>(arr[num]) - get<1>(arr[num - 1])) + abs(get<2>(arr[num]) - get<2>(arr[num - 1])))
            ans = max(self(self, num + 1, get<0>(arr[num])), ans);
        return ans;
    };

    cout << dfs(dfs, 0, 0);
}
