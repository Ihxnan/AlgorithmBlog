// https://www.luogu.com.cn/problem/P2758
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    string a, b;
    cin >> a >> b;
    a.insert(0, 1, 'x'), b.insert(0, 1, 'x');
    vvi dp(a.size(), vi(b.size()));
    for (int i = 0; i < a.size(); ++i)
        dp[i][0] = i;
    for (int i = 0; i < b.size(); ++i)
        dp[0][i] = i;
    for (int i = 1; i < a.size(); ++i)
        for (int j =1; j < b.size(); ++j)
            if (a[i] == b[j])
                dp[i][j] = dp[i - 1][j - 1];
            else
                dp[i][j] = min({dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]}) + 1;
    cout << dp[a.size() - 1][b.size() - 1];
}
