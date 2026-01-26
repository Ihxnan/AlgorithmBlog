// https://pintia.cn/problem-sets/994805046380707840/exam/problems/type/7?problemSetProblemId=994805110318678016
#include "../../template.cpp"

void init()
{
    t = 1; // 只有一组测试数据
}

void solve()
{
    string a, b;
    cin >> a;
    cin.get();
    getline(cin, b);
    auto func = [](string &str) -> int {
        for (auto &p : str)
            if (!isdigit(p))
            {
                str = "?";
                break;
            }
        int ans = 0;
        if (str != "?")
        {
            ans = stoi(str);
            if (ans < 1 || ans > 1000)
                str = "?";
        }
        return ans;
    };
    int na = func(a), nb = func(b);
    cout << a << " + " << b << " = " << (a == "?" || b == "?" ? "?" : to_string(na + nb)) << endl;
}
