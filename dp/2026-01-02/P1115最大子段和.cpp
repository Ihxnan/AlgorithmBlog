// https://www.luogu.com.cn/problem/P1115
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;
    int ans = -iINF, dp = 0;
    for (int i = 0, t; i < n; ++i)
    {
        cin >> t;
        dp = max(0, dp + t);
        ans = max(ans, dp ? dp : t);
    }
    cout << ans;
}
