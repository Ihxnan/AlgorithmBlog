// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805138600869888
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    int n;
    cin >> n;

    auto func = [&](int s) -> vi
    {
        vi ans;
        int t = n;
        while (t % s == 0)
            t /= s, ans.pb(s++);
        return ans;
    };

    vi ans;
    for (int i = 2; i <= sqrt(n); ++i)
    {
        vi tmp = func(i);
        if (tmp.size() > ans.size())
            ans = tmp;
    }

    if (ans.empty())
        ans.pb(n);
    cout << ans.size() << endl;
    for (int i = 0; i < ans.size(); ++i)
        cout << ans[i] << "*\n"[i == ans.size() - 1];
}
