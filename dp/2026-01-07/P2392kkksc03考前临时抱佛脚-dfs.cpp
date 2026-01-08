// https://www.luogu.com.cn/problem/P2392
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int arr[4];
    for (auto &p : arr)
        cin >> p;
    int ans = 0;
    vi v;

    int t;

    // 一个数组分成两份的最小的差值
    auto func = [&](auto &&self, int pos, int l, int r) -> void
    {
        if (pos == v.size())
        {
            t = min(t, abs(r - l));
            return;
        }
        self(self, pos + 1, l + v[pos], r);
        self(self, pos + 1, l, r + v[pos]);
    };

    for (auto &p : arr)
    {
        v.resize(p + 1);
        for (int i = 1; i <= p; ++i)
            cin >> v[i];
        int sum = accumulate(all(v), 0);
        t = iINF;
        func(func, 1, 0, 0);
        ans += (sum - t) / 2 + t;
    }

    cout << ans << endl;
}
